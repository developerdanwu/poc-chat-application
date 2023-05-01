import React from "react";
import clsx from "clsx";

const ChatBubble = ({
  children,
  variant = "sender",
  sendDate,
}: {
  sendDate: string;
  variant?: "sender" | "receiver";
  children: React.ReactNode;
}) => {
  return (
    <div
      className={clsx("chat", {
        "chat-start": variant === "receiver",
        "chat-end": variant === "sender",
      })}
    >
      <div
        className={clsx("chat-bubble h-max", {
          "chat-bubble-secondary bg-white": variant === "receiver",
          "chat-bubble-primary": variant === "sender",
        })}
      >
        {children}
        <div
          className={
            "float-right ml-[10px] mt-[15px] whitespace-nowrap text-xs"
          }
        >
          {sendDate}
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
