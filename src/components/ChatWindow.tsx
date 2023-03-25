import React from "react";
import ChatBubble from "@/components/ChatBubble";
import { useChatStore } from "@/pages";

const ChatWindow = ({ aiTyping }: { aiTyping: boolean }) => {
  const chatStore = useChatStore();
  return (
    <div
      className={
        "flex h-full w-full flex-col space-y-2 overflow-auto bg-black p-7"
      }
    >
      {chatStore.messages.map((m) => {
        return (
          <ChatBubble
            variant={m.role === "user" ? "accent" : "secondary"}
            key={m.id}
            direction={m.role === "user" ? "end" : "start"}
          >
            {m.text}
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
