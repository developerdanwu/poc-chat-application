import { useChannel } from '@ably-labs/react-hooks';
import { ablyChannelKeyStore } from '@/utils/useAblyWebsocket';
import { api } from '@/utils/api';
import produce from 'immer';
import { useUser } from '@clerk/nextjs';
import { RouterOutput } from '@/server/api/root';
import dayjs from 'dayjs';
import { useEffect, useMemo } from 'react';

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

export const useChatWindowScroll = (
  scrollAreaRef: React.RefObject<HTMLDivElement>
) => {
  useEffect(() => {
    const listener = (event: Event) => {
      if (
        event.currentTarget instanceof HTMLElement &&
        event.target instanceof HTMLElement
      ) {
        const sentBy = event.target.getAttribute('data-communicator');

        event.currentTarget.scroll({
          top: event.currentTarget.scrollHeight,
          behavior: 'smooth',
        });
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

export const useMessageUpdate = (chatroomId: string) => {
  const trpcUtils = api.useContext();
  const currentUser = useUser();
  useChannel(ablyChannelKeyStore.chatroom(chatroomId), (message) => {
    if (message.data.author.userId !== currentUser.user?.id) {
      trpcUtils.messaging.getMessages.setInfiniteData({ chatroomId }, (old) => {
        if (!old) {
          return {
            pages: [],
            pageParams: [],
          };
        }

        if (old.pages.length === 0) {
          return {
            pages: [
              {
                messages: [message.data],
                next_cursor: null,
              },
            ],
            pageParams: [],
          };
        }

        const newState = produce(old.pages, (draft) => {
          draft[0]?.messages.unshift(message.data);
        });

        return {
          pages: newState,
          pageParams: old.pageParams,
        };
      });
    }
  });
};
