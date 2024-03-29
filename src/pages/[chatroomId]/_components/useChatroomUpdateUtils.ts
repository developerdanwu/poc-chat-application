import { api } from '@/lib/api';
import produce from 'immer';
import { type RouterOutput } from '@/server/api/root';
import { MESSAGES_PER_PAGE } from '@/pages/[chatroomId]/_components/main/main-content/ChatWindow/constants';

const useChatroomUpdateUtils = () => {
  const trpcUtils = api.useContext();

  const updateMessages = ({
    message,
  }: {
    message: RouterOutput['messaging']['getMessages']['messages'][number];
  }) => {
    trpcUtils.messaging.getMessagesCount.setData(
      { chatroomId: message.chatroom_id },
      (old) => {
        if (!old) {
          return old;
        }

        return {
          messages_count: old.messages_count + 1,
        };
      }
    );
    trpcUtils.messaging.getMessages.setInfiniteData(
      { chatroomId: message.chatroom_id },
      (old) => {
        if (!old) {
          return {
            pages: [{ messages: [], next_cursor: 0 }],
            pageParams: [],
          };
        }

        if (old.pages.length === 0) {
          return {
            pages: [
              {
                messages: [message],
                next_cursor: 0,
              },
            ],
            pageParams: [],
          };
        }

        const isMessageAlreadyInState = old.pages.some((page) =>
          page.messages.some(
            (m) =>
              m.client_message_id === message.client_message_id ||
              message.message_checksum === m.message_checksum
          )
        );

        const newState = produce(old.pages, (draft) => {
          if (isMessageAlreadyInState) {
            // update message
            draft.forEach((page) => {
              page.messages.forEach((m) => {
                if (
                  m.message_checksum === message.message_checksum ||
                  m.client_message_id === message.client_message_id
                ) {
                  m = message;
                }
              });
            });
          } else {
            // append new message
            if (draft[0] && draft[0].messages.length < MESSAGES_PER_PAGE) {
              draft[0]?.messages.unshift(message);
              return draft;
            }

            draft.unshift({
              messages: [message],
            });
          }

          return draft;
        });

        return {
          pages: newState || [],
          pageParams: old.pageParams,
        };
      }
    );
  };

  const updateChatroom = ({
    chatroom,
    chatroomId,
  }: {
    chatroom: RouterOutput['chatroom']['getChatroom'];
    chatroomId: string;
  }) => {
    trpcUtils.chatroom.getChatroom.setData({ chatroomId }, (old) => {
      if (!old) {
        return old;
      }

      return chatroom;
    });
  };

  return { updateMessages, updateChatroom };
};

export default useChatroomUpdateUtils;
