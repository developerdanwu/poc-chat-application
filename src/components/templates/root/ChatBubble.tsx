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
      data-communicator={variant === "sender" ? "sender" : "receiver"}
      className={"chat chat-start"}
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
