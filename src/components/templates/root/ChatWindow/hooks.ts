import { useEffect } from 'react';
import { useChannel } from '@ably-labs/react-hooks';
import { ablyChannelKeyStore } from '@/utils/useAblyWebsocket';
import { api } from '@/utils/api';
import produce from 'immer';
import { useUser } from '@clerk/nextjs';

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
