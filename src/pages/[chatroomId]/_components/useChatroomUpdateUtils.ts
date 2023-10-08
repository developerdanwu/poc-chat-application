import { api } from '@/lib/api';
import produce from 'immer';
import { type RouterOutput } from '@/server/api/root';

const useChatroomUpdateUtils = () => {
  const trpcUtils = api.useContext();

  const updateMessages = ({
    chatroomId,
    message,
  }: {
    chatroomId: string;
    message: RouterOutput['messaging']['getMessages']['messages'][number];
  }) => {
    trpcUtils.messaging.getMessages.setInfiniteData({ chatroomId }, (old) => {
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

      const newState = produce(old.pages, (draft) => {
        if (draft[0] && draft[0].messages.length < 10) {
          draft[0]?.messages.unshift(message);
          return draft;
        }

        draft.unshift({
          messages: [message],
          next_cursor: null as unknown as number,
        });

        return draft;
      });

      return {
        pages: newState || [],
        pageParams: old.pageParams,
      };
    });
  };

  return { updateMessages };
};

export default useChatroomUpdateUtils;