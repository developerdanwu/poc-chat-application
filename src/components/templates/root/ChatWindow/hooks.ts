import { useChannel } from '@ably-labs/react-hooks';
import { ablyChannelKeyStore } from '@/utils/useAblyWebsocket';
import { api } from '@/utils/api';
import { useUser } from '@clerk/nextjs';
import { RouterOutput } from '@/server/api/root';
import dayjs from 'dayjs';
import { useEffect, useMemo } from 'react';
import produce from 'immer';

export const useChatWindowLogic = ({ chatroomId }: { chatroomId: string }) => {
  const messages = api.messaging.getMessages.useInfiniteQuery(
    {
      chatroomId: chatroomId,
    },
    {
      getNextPageParam: (lastPage) => {
        if (lastPage?.next_cursor === 0) {
          return undefined;
        }
        return lastPage?.next_cursor;
      },
      staleTime: Infinity,
      enabled: !!chatroomId,
    }
  );

  const messagesArray = useMemo(() => {
    return messages.data?.pages.reduce<
      RouterOutput['messaging']['getMessages']['messages']
    >((acc, nextVal) => {
      nextVal.messages.forEach((m) => {
        acc.push(m);
      });
      return acc;
    }, []);
  }, [messages.data?.pages]);

  const messagesGroupedByDate = useMemo(() => {
    return messagesArray?.reduce<
      Record<string, RouterOutput['messaging']['getMessages']['messages']>
    >((acc, nextVal) => {
      const date = dayjs
        .utc(nextVal.created_at)
        .local()
        .format('dddd, MMMM Do');
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date]!.push(nextVal);
      return acc;
    }, {});
  }, [messagesArray]);

  const messageGroupKeys = Object.keys(messagesGroupedByDate || {});
  const formattedMessages = useMemo(() => {
    return messageGroupKeys.reduce<
      (string | RouterOutput['messaging']['getMessages']['messages'][number])[]
    >((acc, k) => {
      const formattedMessageGroup = messagesGroupedByDate?.[k];

      if (formattedMessageGroup) {
        acc.push(...formattedMessageGroup);
      }
      acc.push(k);
      return acc;
    }, []);
  }, [messageGroupKeys, messagesGroupedByDate]);

  return {
    formattedMessages,
    messages,
    messageGroupKeys,
    messagesGroupedByDate,
  };
};

export const useChatWindowScroll = ({
  chatroomId,
  chatBottomRef,
  scrollAreaRef,
}: {
  scrollAreaRef: React.RefObject<HTMLDivElement>;
  chatroomId: string;
  chatBottomRef: React.RefObject<HTMLDivElement>;
}) => {
  useEffect(() => {
    const listener = (event: Event) => {
      if (chatBottomRef.current) {
        // if user sends message, scroll to bottom of conversation

        chatBottomRef.current.scrollIntoView();
      }
    };

    if (scrollAreaRef.current) {
      scrollAreaRef.current.addEventListener('DOMNodeInserted', listener);
    }

    return () => {
      if (scrollAreaRef.current) {
        scrollAreaRef.current.removeEventListener(
          'DOMNodeInserted',
          listener,
          false
        );
      }
    };
  }, []);
};

export const useMessageUpdate = ({ chatroomId }: { chatroomId: string }) => {
  const currentUser = useUser();
  const trpcUtils = api.useContext();
  useChannel(ablyChannelKeyStore.chatroom(chatroomId), async (message) => {
    const typedMessage =
      message.data as RouterOutput['messaging']['sendMessage'];

    if (typedMessage) {
      if (typedMessage.author.user_id !== currentUser.user?.id) {
        trpcUtils.messaging.getMessages.setInfiniteData(
          { chatroomId },
          (old) => {
            if (!old) {
              return {
                pages: [{ messages: [], next_cursor: 0 }],
                pageParams: [],
              };
            }

            const newMessage = {
              client_message_id: typedMessage.client_message_id,
              text: typedMessage.text,
              content: typedMessage.content,
              created_at: typedMessage.created_at,
              updated_at: typedMessage.updated_at,
              author: {
                user_id: typedMessage.author.user_id,
                author_id: typedMessage.author.author_id,
                last_name: typedMessage.author.last_name,
                first_name: typedMessage.author.first_name,
              },
            };

            if (old.pages.length === 0) {
              return {
                pages: [
                  {
                    messages: [newMessage],
                    next_cursor: 0,
                  },
                ],
                pageParams: [],
              };
            }

            const newState = produce(old.pages, (draft) => {
              if (draft[0] && draft[0].messages.length < 10) {
                draft[0]?.messages.unshift(newMessage);
                return draft;
              }

              draft.unshift({
                messages: [newMessage],
                next_cursor: null as unknown as number,
              });

              return draft;
            });

            return {
              pages: newState || [],
              pageParams: old.pageParams,
            };
          }
        );
      }
    }
  });
};
