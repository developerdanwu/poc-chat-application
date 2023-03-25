import React from "react";
import clsx from "clsx";

const ChatBubble = ({
  children,
  direction,
}: {
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
      <div className="chat-bubble">{children}</div>
    </div>
  );
};

export default ChatBubble;
