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
        "group flex w-full cursor-pointer items-center space-x-3 px-2  hover:bg-neutral-700"
      }
    >
      <Avatar size={"md"} alt={name.slice(0, 2)} />
      <div
        className={
          "flex flex-1 flex-col border-t border-neutral py-3 group-hover:border-t-0"
        }
      >
        <p className={"select-none"}>{name}</p>
        <p className={"select-none overflow-ellipsis text-sm text-neutral-500"}>
          {lastMessage}
        </p>
      </div>
    </div>
  );
};

export default ThreadListItem;
