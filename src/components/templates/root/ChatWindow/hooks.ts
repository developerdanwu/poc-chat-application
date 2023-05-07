import { useEffect } from "react";
import { useChannel } from "@ably-labs/react-hooks";
import { ablyChannelKeyStore } from "@/utils/useAblyWebsocket";
import { RouterOutput } from "@/server/api/root";
import { getQueryKey } from "@trpc/react-query";
import { api } from "@/utils/api";
import produce from "immer";
import { useQueryClient } from "@tanstack/react-query";

export const useChatWindowScroll = (
  scrollAreaRef: React.RefObject<HTMLDivElement>
) => {
  useEffect(() => {
    const listener = (event: Event) => {
      if (
        event.currentTarget instanceof HTMLElement &&
        event.target instanceof HTMLElement
      ) {
        const sentBy = event.target.getAttribute("data-communicator");

        event.currentTarget.scroll({
          top: event.currentTarget.scrollHeight,
          behavior: "smooth",
        });
      }
    };
    if (scrollAreaRef.current) {
      scrollAreaRef.current.addEventListener("DOMNodeInserted", listener);
    }

    return () => {
      if (scrollAreaRef.current) {
        scrollAreaRef.current.removeEventListener(
          "DOMNodeInserted",
          listener,
          false
        );
      }
    };
  }, []);
};

export const useMessageUpdate = (chatroomId: string) => {
  const queryClient = useQueryClient();
  useChannel(ablyChannelKeyStore.chatroom(chatroomId), (message) => {
    queryClient.setQueryData<RouterOutput["messaging"]["getMessages"]>(
      getQueryKey(
        api.messaging.getMessages,
        {
          chatroomId,
        },
        "query"
      ),
      (old) => {
        if (old) {
          const newState = produce(old, (draft) => {
            draft.messages.push(message.data);
          });
          return newState;
        }

        return old;
      }
    );
  });
};
