import React from "react";
import Avatar from "@/components/elements/Avatar";
import Link from "next/link";

const ThreadListItem = ({
  name,
  chatroomId,
}: {
  chatroomId: string;
  name: string;
}) => {
  return (
    <Link
      href={`/?chatroomId=${chatroomId}`}
      className={
        "group flex w-full cursor-pointer items-start space-x-3  hover:bg-neutral-700"
      }
    >
      <Avatar size={"md"} alt={name.slice(0, 2)} />
      <div className={"flex flex-1 flex-col"}>
        <p className={"select-none font-semibold"}>{name}</p>
      </div>
    </Link>
  );
};

export default ThreadListItem;
