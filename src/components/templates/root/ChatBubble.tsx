import React from "react";
import Avatar from "@/components/elements/Avatar";
import dayjs from "dayjs";
import { RouterOutput } from "@/server/api/root";
import { getFullName } from "@/utils/utils";

const ChatBubble = ({
  children,
  author,
  variant = "sender",
  sendDate,
}: {
  author: RouterOutput["messaging"]["getMessages"]["messages"][number]["author"];
  sendDate: string;
  variant?: "sender" | "receiver";
  children: React.ReactNode;
}) => {
  const fullName = getFullName({
    firstName: author.firstName,
    lastName: author.lastName,
    fallback: "Untitled",
  });
  return (
    <div
      data-communicator={variant === "sender" ? "sender" : "receiver"}
      className={"chat chat-start"}
    >
      <Avatar alt={fullName.slice(0, 2)} />
      <div className={"flex flex-col space-y-2"}>
        <div className={"flex items-center space-x-2 text-sm font-semibold"}>
          {<p>{fullName}</p>}
          <div className={"text-xs font-normal text-warm-gray-400"}>
            {dayjs(sendDate).format("hh:mm a")}
          </div>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

export default ChatBubble;
