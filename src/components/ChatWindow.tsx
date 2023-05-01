import React from "react";
import ChatBubble from "@/components/ChatBubble";
import { api } from "@/utils/api";
import { useUser } from "@clerk/nextjs";
import ScrollArea from "@/components/elements/ScrollArea";

const ChatWindow = ({ aiTyping }: { aiTyping: boolean }) => {
  const user = useUser();
  const messages = api.messaging.getMessages.useQuery({
    chatroomId: "clh4sfne50000e6b7s4764us2",
  });
  return (
    <ScrollArea
      componentProps={{
        root: {
          className:
            "flex overflow-hidden h-full w-full rounded-xl bg-base-100",
        },
        viewport: {
          className: "h-full w-full",
        },
      }}
    >
      <div className={"flex flex-col space-y-4 px-6"}>
        {messages.data?.messages.map((m) => {
          const isSentByMe = m.senderId === user.user?.id;
          return (
            <ChatBubble
              sendDate={m.timestamp.toDateString()}
              variant={isSentByMe ? "sender" : "receiver"}
              key={m.id}
            >
              {m.message}
            </ChatBubble>
          );
        })}
      </div>
    </ScrollArea>
  );
};

export default ChatWindow;
