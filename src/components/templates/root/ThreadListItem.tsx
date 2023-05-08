import React from "react";
import Avatar from "@/components/elements/Avatar";
import { cn } from "@/utils/utils";

const ThreadListItem = ({
  name,
  selected,
}: {
  selected?: boolean;
  name: string;
}) => {
  return (
    <div
      className={cn(
        "flex w-full cursor-pointer items-center space-x-3 rounded-sm py-2 px-3 hover:bg-warm-gray-300",
        {
          "bg-gray-900 hover:bg-gray-900": selected,
        }
      )}
    >
      <Avatar size={"xs"} alt={name.slice(0, 2)} />
      <p
        className={cn("select-none text-xs font-normal leading-4", {
          "text-white": selected,
        })}
      >
        {name}
      </p>
    </div>
  );
};

export default ThreadListItem;
