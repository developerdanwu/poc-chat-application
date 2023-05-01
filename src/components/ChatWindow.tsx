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
            "flex h-full w-full flex-col space-y-2 overflow-hidden rounded-xl bg-secondary p-7",
        },
      }}
    >
      {messages.data?.messages.map((m) => {
        const isSentByMe = m.senderId === user.user?.id;
        return (
          <ChatBubble
            sendDate={m.timestamp.toDateString()}
            variant={isSentByMe ? "primary" : "secondary"}
            key={m.id}
            direction={isSentByMe ? "end" : "start"}
          >
            {m.message}
          </ChatBubble>
        );
      })}
    </ScrollArea>
  );
};

export default ChatWindow;
