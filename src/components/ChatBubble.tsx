import React from "react";
import clsx from "clsx";

const ChatBubble = ({
  children,
  direction,
  variant,
  sendDate,
}: {
  sendDate: string;
  variant?: "primary" | "secondary";
  children: React.ReactNode;
  direction: "start" | "end";
}) => {
  return (
    <div
      className={clsx("chat", {
        "chat-start": direction === "start",
        "chat-end": direction === "end",
      })}
    >
      <div
        className={clsx("chat-bubble h-full", {
          "chat-bubble-secondary bg-white": variant === "secondary",
          "chat-bubble-primary": variant === "primary",
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
