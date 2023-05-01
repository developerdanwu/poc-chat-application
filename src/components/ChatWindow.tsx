import React from "react";
import ChatBubble from "@/components/ChatBubble";
import { api } from "@/utils/api";
import { useUser } from "@clerk/nextjs";

const ChatWindow = ({ aiTyping }: { aiTyping: boolean }) => {
  const user = useUser();
  const messages = api.messaging.getMessages.useQuery({
    chatroomId: "clfr09kr00000e65bh3f38lmt",
  });
  return (
    <div
      className={
        "flex h-full w-full flex-col space-y-2 overflow-auto bg-secondary p-7"
      }
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
      {aiTyping && (
        <ChatBubble direction={"start"}>
          <div className={"flex h-full w-max w-full items-center space-x-2"}>
            <div
              className={
                "my-0 h-2 w-2 animate-typing-dot rounded-full bg-white"
              }
            />
            <div
              className={
                "my-0  h-2 w-2 animate-typing-dot rounded-full bg-white animation-delay-100"
              }
            />
            <div
              className={
                "my-0 h-2 w-2 animate-typing-dot rounded-full bg-white animation-delay-400"
              }
            />
          </div>
        </ChatBubble>
      )}
    </div>
  );
};

export default ChatWindow;
