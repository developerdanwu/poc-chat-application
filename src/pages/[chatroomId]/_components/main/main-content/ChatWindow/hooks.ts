import { api } from '@/lib/api';
import { type RouterOutput } from '@/server/api/root';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import { MESSAGES_PER_PAGE } from '@/pages/[chatroomId]/_components/main/main-content/ChatWindow/constants';

export const useChatroomMessages = ({
  chatroomId,
}: {
  chatroomId?: string;
}) => {
  const messagesQuery = api.messaging.getMessages.useInfiniteQuery(
    {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      chatroomId: chatroomId!,
    },
    {
      enabled: !!chatroomId,
      // suspense: true,
      getNextPageParam: (lastPage) => {
        if (lastPage.messages.length < MESSAGES_PER_PAGE) {
          return undefined;
        } else {
          if (lastPage.messages.length === 0) {
            return undefined;
          }
          return lastPage.messages[lastPage.messages.length - 1]!.created_at;
        }
      },

      staleTime: Infinity,
    }
  );

  const messagesCountQuery = api.messaging.getMessagesCount.useQuery(
    {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      chatroomId: chatroomId!,
    },
    {
      enabled: !!chatroomId,
    }
  );

  const messages = useMemo(
    () =>
      messagesQuery.data?.pages
        .reduce<RouterOutput['messaging']['getMessages']['messages']>(
          (acc, nextVal) => {
            nextVal.messages.forEach((m) => {
              acc.push(m);
            });
            return acc;
          },
          []
        )
        .reverse()

        .map((m, index, array) => {
          return {
            ...m,
            ...(array[index - 2]
              ? {
                  previousMessage: array[index - 2],
                }
              : {}),
          };
        }),
    [messagesQuery.data?.pages]
  );

  const groupedMessages = messages?.reduce<
    Record<string, RouterOutput['messaging']['getMessages']['messages']>
  >((acc, nextVal) => {
    if (nextVal) {
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
    }

    return acc;
  }, {});

  const groupedMessagesKeys = Object.keys(groupedMessages || {});

  const groupedMessagesCount = groupedMessages
    ? Object.values(groupedMessages).map((messages) => messages.length)
    : undefined;

  return {
    messagesCountQuery,
    groupedMessagesKeys,
    messagesQuery,
    messages,
    groupedMessages,
    groupedMessagesCount,
  };
};
