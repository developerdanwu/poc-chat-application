import { useChannel } from '@ably-labs/react-hooks';
import { ablyChannelKeyStore, MESSAGE_STREAM_NAMES } from '@/lib/ably';
import { api } from '@/lib/api';
import { useUser } from '@clerk/nextjs';
import { type RouterOutput } from '@/server/api/root';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import produce from 'immer';

export const useChatroomMessages = ({ chatroomId }: { chatroomId: string }) => {
  const messages = api.messaging.getMessages.useInfiniteQuery(
    {
      chatroomId: chatroomId,
    },
    {
      getNextPageParam: (lastPage) => {
        return lastPage?.next_cursor === 0 ? undefined : lastPage?.next_cursor;
      },
      keepPreviousData: true,
      staleTime: Infinity,
    }
  );

  const messagesArray = useMemo(
    () =>
      messages.data?.pages.reduce<
        RouterOutput['messaging']['getMessages']['messages']
      >((acc, nextVal) => {
        nextVal.messages.forEach((m) => {
          acc.push(m);
        });
        return acc;
      }, []),
    [messages.data?.pages]
  );

  const formattedMessages = messagesArray?.reduce<
    Record<string, RouterOutput['messaging']['getMessages']['messages']>
  >((acc, nextVal) => {
    const date = dayjs
      .utc(nextVal.created_at)
      .local()
      .hour(0)
      .minute(0)
      .second(0)
      .format();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date]!.push(nextVal);
    return acc;
  }, {});

  return {
    messages,
    formattedMessages,
  };
};

export const useMessageUpdate = ({ chatroomId }: { chatroomId: string }) => {
  const currentUser = useUser();
  const trpcUtils = api.useContext();
  useChannel(ablyChannelKeyStore.chatroom(chatroomId), async (message) => {
    const messageNameCast =
      message.name as (typeof MESSAGE_STREAM_NAMES)[keyof typeof MESSAGE_STREAM_NAMES];

    if (messageNameCast === MESSAGE_STREAM_NAMES.openAiMessage) {
      const typedMessage = message.data as {
        message: string;
        runId: string;
        parentRunId: string;
        authorId: number;
      };
      if (typedMessage) {
        trpcUtils.messaging.getMessages.setInfiniteData(
          {
            chatroomId,
          },
          (old) => {
            if (!old) {
              return {
                pages: [{ messages: [], next_cursor: 0 }],
                pageParams: [],
              };
            }

            const newMessage = {
              created_at: dayjs.utc().toDate(),
              updated_at: dayjs.utc().toDate(),
              text: typedMessage.message,
              author_id: typedMessage.authorId,
              client_message_id: typedMessage.runId,
              content: typedMessage.message,
              is_edited: false,
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
              let updated = false;

              draft.forEach((page, pageIndex) => {
                page.messages.forEach((message, messageIndex) => {
                  if (
                    message.client_message_id === newMessage.client_message_id
                  ) {
                    console.log('FIREDDDD');
                    draft[pageIndex].messages[messageIndex] = newMessage;
                    updated = true;
                  }
                });
              });

              if (!updated && draft[0] && draft[0].messages.length < 10) {
                draft[0]?.messages.unshift(newMessage);
                return draft;
              }

              if (!updated) {
                draft.unshift({
                  messages: [newMessage],
                  next_cursor: undefined as unknown as number,
                });
              }

              return draft;
            });

            return {
              pages: newState || [],
              pageParams: old.pageParams,
            };

            console.log('TYPED', typedMessage);
            return old;
          }
        );
      }

      console.log('MESSAGE', message);
    }
    // const typedMessage =
    //   message.data as RouterOutput['messaging']['sendMessage'];
    //
    // if (typedMessage) {
    //   if (typedMessage.author.user_id !== currentUser.user?.id) {
    //     trpcUtils.messaging.getMessages.setInfiniteData(
    //       { chatroomId },
    //       (old) => {
    //         if (!old) {
    //           return {
    //             pages: [{ messages: [], next_cursor: 0 }],
    //             pageParams: [],
    //           };
    //         }
    //
    //         const newMessage = {
    //           client_message_id: typedMessage.client_message_id,
    //           text: typedMessage.text,
    //           content: typedMessage.content,
    //           created_at: typedMessage.created_at,
    //           updated_at: typedMessage.updated_at,
    //           is_edited: false,
    //           author: {
    //             role: typedMessage.author.role,
    //             user_id: typedMessage.author.user_id,
    //             author_id: typedMessage.author.author_id,
    //             last_name: typedMessage.author.last_name,
    //             first_name: typedMessage.author.first_name,
    //           },
    //         };
    //
    //         if (old.pages.length === 0) {
    //           return {
    //             pages: [
    //               {
    //                 messages: [newMessage],
    //                 next_cursor: 0,
    //               },
    //             ],
    //             pageParams: [],
    //           };
    //         }
    //
    //         const newState = produce(old.pages, (draft) => {
    //           if (draft[0] && draft[0].messages.length < 10) {
    //             draft[0]?.messages.unshift(newMessage);
    //             return draft;
    //           }
    //
    //           draft.unshift({
    //             messages: [newMessage],
    //             next_cursor: undefined as unknown as number,
    //           });
    //
    //           return draft;
    //         });
    //
    //         return {
    //           pages: newState || [],
    //           pageParams: old.pageParams,
    //         };
    //       }
    //     );
    //   }
    // }
  });
};
