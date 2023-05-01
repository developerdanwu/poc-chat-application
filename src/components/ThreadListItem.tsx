import React from "react";
import Avatar from "@/components/Avatar";

const ThreadListItem = ({
  name,
  lastMessage,
}: {
  name: string;
  lastMessage: string;
}) => {
  return (
    <div
      className={
        "group flex w-full cursor-pointer items-start space-x-3  hover:bg-neutral-700"
      }
    >
      <Avatar size={"md"} alt={name.slice(0, 2)} />
      <div className={"flex flex-1 flex-col"}>
        <p className={"select-none font-semibold"}>{name}</p>
        <p className={"select-none overflow-ellipsis text-sm text-neutral-500"}>
          {lastMessage}
        </p>
      </div>
    </div>
  );
};

export default ThreadListItem;
