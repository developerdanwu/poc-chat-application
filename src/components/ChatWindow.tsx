import React, { useEffect, useRef } from "react";
import { api } from "@/utils/api";
import { useUser } from "@clerk/nextjs";
import ScrollArea from "@/components/elements/ScrollArea";
import ChatBubble from "@/components/ChatBubble";

const ChatWindow = ({ chatroomId }: { chatroomId: string }) => {
  const user = useUser();
  const messages = api.messaging.getMessages.useQuery(
    {
      chatroomId: chatroomId ?? "",
    },
    {
      enabled: !!chatroomId,
    }
  );
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const listener = (event: Event) => {
      if (
        event.currentTarget instanceof HTMLElement &&
        event.target instanceof HTMLElement
      ) {
        const sentBy = event.target.getAttribute("data-communicator");
        if (sentBy === "sender") {
          event.currentTarget.scroll({
            top: event.currentTarget.scrollHeight,
            behavior: "smooth",
          });
        }
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

  return (
    <ScrollArea
      componentProps={{
        root: {
          className:
            "flex overflow-hidden h-full w-full rounded-xl  bg-base-100",
        },
        viewport: {
          ref: scrollAreaRef,
          className: "h-full w-full",
        },
      }}
    >
      <div className={"flex flex-col space-y-4 px-6 py-3"}>
        {messages.data?.messages.map((m) => {
          const isSentByMe = m.author.userId === user.user?.id;
          return (
            <ChatBubble
              sendDate={m.createdAt.toDateString()}
              variant={isSentByMe ? "sender" : "receiver"}
              key={m.clientMessageId}
            >
              {m.text}
            </ChatBubble>
          );
        })}
      </div>
    </ScrollArea>
  );
};

export default ChatWindow;
