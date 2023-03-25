import React from "react";
import ChatBubble from "@/components/ChatBubble";
import { useChatStore } from "@/pages";

const ChatWindow = ({ aiTyping }: { aiTyping: boolean }) => {
  const chatStore = useChatStore();
  const test =
    "Here's an example function in Python that takes in two numbers and multiplies them: ```python def multiply(num1, num2): result = num1 * num2 return result ``` You can call this function by passing in two numbers as arguments: ```python result = multiply(2, 3) print(result) # Output: 6 ``` This function multiplies `num1` and `num2` and returns the result.";
  const splitTest = test.split("```");
  console.log(splitTest);
  return (
    <div
      className={
        "flex h-full w-full flex-col space-y-2 overflow-auto bg-black p-7"
      }
    >
      {chatStore.messages.map((m) => {
        console.log(m);
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
