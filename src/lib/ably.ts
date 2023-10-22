import { useChannel, usePresence } from '@ably-labs/react-hooks';
import { useEffect } from 'react';
import { create } from 'zustand';
import produce from 'immer';
import { Types } from 'ably';
import { useAuth } from '@clerk/nextjs';
import { type RouterOutput } from '@/server/api/root';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { getQueryKey } from '@trpc/react-query';
import useChatroomUpdateUtils from '@/pages/[chatroomId]/_components/useChatroomUpdateUtils';
import { useChatroomState } from '@/pages/[chatroomId]/_components/main/main-content/ChatWindow';
import { useRouter } from 'next/router';
import PresenceMessage = Types.PresenceMessage;

export type AblyChannelMessage = {
  user: Omit<Types.Message, 'name' | 'data'> &
    (
      | {
          name: 'get_chatrooms';
          data: RouterOutput['chatroom']['getChatrooms']['chatrooms'][number];
        }
      | {
          name: 'get_chatroom';
          data: RouterOutput['chatroom']['getChatroom'];
        }
      | {
          name: 'message';
          data: RouterOutput['messaging']['getMessages']['messages'][number];
        }
    );
};

export const ablyChannelKeyStore = {
  chatroom: (chatroomId: string) => `chatroom-${chatroomId}`,
  global: 'global',
  user: (userId: string) => `user-${userId}`,
} as const;
export const useAblyStore = create<{
  onlinePresence: Record<string, PresenceMessage>;
  addOnlinePresence: (presenceMessage: PresenceMessage) => void;
  removeOnlinePresence: (clientId: string) => void;
  setOnlinePresence: (presenceMessages: PresenceMessage[]) => void;
  typing: Record<string, number[]>;
  chatroomEditorContent: Record<string, Record<number, string>>;
  setChatroomEditorContent: (data: {
    chatroomId: string;
    content: string;
    authorId: number;
  }) => void;
  addTypingToQueue: (data: { chatroomId: string; authorId: number }) => void;
  removeTypingFromQueue: (data: {
    chatroomId: string;
    authorId: number;
  }) => void;
}>((setState, getState) => ({
  typing: {},
  chatroomEditorContent: {},
  setChatroomEditorContent: ({ chatroomId, content, authorId }) => {
    setState((prev) => ({
      chatroomEditorContent: produce(prev.chatroomEditorContent, (draft) => {
        if (!draft[chatroomId]) {
          draft[chatroomId] = {};
        }
        draft[chatroomId][authorId] = content;
      }),
    }));
  },
  removeTypingFromQueue: ({ chatroomId, authorId }) => {
    const typingState = getState().typing;
    const typingChatroom = typingState[chatroomId];
    if (typingChatroom?.includes(authorId)) {
      setState((prev) => ({
        typing: produce(prev.typing, (draft) => {
          const filteredChatroomAuthors = draft[chatroomId]?.filter(
            (id) => id !== authorId
          );
          if (filteredChatroomAuthors) {
            draft[chatroomId] = filteredChatroomAuthors;
          }
        }),
      }));
    }
  },
  addTypingToQueue: ({ chatroomId, authorId }) => {
    const typingState = getState().typing;
    const typingChatroom = typingState[chatroomId];

    if (!typingChatroom?.includes(authorId)) {
      setState((prev) => ({
        typing: produce(prev.typing, (draft) => {
          if (!draft[chatroomId]) {
            draft[chatroomId] = [authorId];
          }

          draft[chatroomId]?.push(authorId);
        }),
      }));
    }
  },
  onlinePresence: {},
  addOnlinePresence: (presenceMessage) => {
    setState((prev) => ({
      onlinePresence: produce(prev.onlinePresence, (draft) => {
        draft[presenceMessage.clientId] = presenceMessage;
      }),
    }));
  },
  setOnlinePresence: (presenceMessages: PresenceMessage[]) => {
    setState(() => ({
      onlinePresence: presenceMessages.reduce<Record<string, PresenceMessage>>(
        (acc, nextVal) => {
          acc[nextVal.clientId] = nextVal;
          return acc;
        },
        {}
      ),
    }));
  },
  removeOnlinePresence: (clientId: string) => {
    setState((prev) => ({
      onlinePresence: produce(prev.onlinePresence, (draft) => {
        delete draft[clientId];
      }),
    }));
  },
}));
export const useSyncOnlinePresence = () => {
  // subscribe to only set function to prevent global re-render on state change
  const { setOnlinePresence } = useAblyStore((state) => ({
    setOnlinePresence: state.setOnlinePresence,
  }));

  // should only use usePresence hook once and sync with global store because each call counts as 1 call to ably === $$$
  const [onlineUsers] = usePresence<any>({
    channelName: ablyChannelKeyStore.global,
  });

  // HACK: sync presence state with global store
  useEffect(() => {
    setOnlinePresence(onlineUsers);
  }, [setOnlinePresence, onlineUsers]);
};

export const useSyncGlobalStore = () => {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const chatroomUpdateUtils = useChatroomUpdateUtils();
  const chatroomState = useChatroomState((state) => ({
    setReceivedNewMessage: state.setReceivedNewMessage,
  }));
  const router = useRouter();

  useChannel(
    {
      channelName: ablyChannelKeyStore.user(auth.userId!),
    },
    // @ts-expect-error this is correct typing
    (message: AblyChannelMessage['user']) => {
      switch (message.name) {
        case 'get_chatrooms': {
          queryClient.setQueriesData<RouterOutput['chatroom']['getChatrooms']>(
            getQueryKey(api.chatroom.getChatrooms),
            (oldData) => {
              if (!oldData) {
                return oldData;
              }

              return produce(oldData, (draft) => {
                const chatroomIndex = draft.chatrooms.findIndex(
                  (chatroom) => chatroom.id === message.data.id
                );

                if (chatroomIndex !== -1) {
                  draft.chatrooms[chatroomIndex] = message.data;
                }
              });
            }
          );
          break;
        }
        case 'get_chatroom': {
          chatroomUpdateUtils.updateChatroom({
            chatroomId: message.data.id,
            chatroom: message.data,
          });
          break;
        }
        case 'message': {
          const showNotification = (
            message: Extract<AblyChannelMessage['user'], { name: 'message' }>
          ) => {
            const n = new Notification(`New Message`, {
              body: message.data.text,
            });

            n.addEventListener('click', () => {
              router.push(`/${message.data.chatroom_id}`);
              n.close();
            });
          };

          if (Notification.permission === 'granted') {
            showNotification(message);
          } else {
            Notification.requestPermission().then((result) => {
              if (result === 'granted') {
                showNotification(message);
              }
            });
          }

          chatroomState.setReceivedNewMessage(message.data.chatroom_id, true);
          chatroomUpdateUtils.updateMessages({
            message: message.data,
          });
          break;
        }
      }
    }
  );
};
