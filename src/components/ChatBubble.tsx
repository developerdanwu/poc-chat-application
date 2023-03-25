import React from "react";
import clsx from "clsx";

const ChatBubble = ({
  children,
  direction,
  variant,
}: {
  variant?: "primary" | "secondary" | "accent";
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
          "chat-bubble-accent": variant === "accent",
          "chat-bubble-secondary": variant === "secondary",
          "chat-bubble-primary": variant === "primary",
        })}
      >
        {children}
      </div>
    </div>
  );
};

export default ChatBubble;
