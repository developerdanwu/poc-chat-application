import React from "react";
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

  return (
    <ScrollArea
      componentProps={{
        root: {
          className:
            "flex overflow-hidden h-full w-full rounded-xl  bg-base-100",
        },
        viewport: {
          className: "h-full w-full",
        },
      }}
    >
      <div className={"flex flex-col space-y-4 px-6 py-3"}>
        {messages.data?.messages.map((m) => {
          const isSentByMe = false;
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
