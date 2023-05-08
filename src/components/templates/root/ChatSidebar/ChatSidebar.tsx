import React, { useState } from "react";
import { api } from "@/utils/api";
import { cn } from "@/utils/utils";
import Input from "@/components/elements/Input";
import { RiPencilLine } from "react-icons/ri";
import ThreadListItem from "@/components/templates/root/ThreadListItem";
import { notEmpty } from "@/utils/ts-utils";
import { useRouter } from "next/router";
import { useDebounce } from "react-use";
import RadialProgress from "@/components/elements/RadialProgress";

const ChatSidebar = () => {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const chatrooms = api.messaging.getChatrooms.useQuery({
    searchKeyword: debouncedSearch,
  });
  useDebounce(
    () => {
      setDebouncedSearch(search);
    },
    1000,
    [search]
  );

  const chatroomId =
    typeof router.query.chatroomId === "string" ? router.query.chatroomId : "";
  return (
    <div
      className={
        "flex h-full flex-[0_0_256px] flex-col overflow-hidden border-r-2 border-black bg-warm-gray-200 "
      }
    >
      <div
        className={cn(
          "mb-4 flex h-full w-full flex-[0_0_60px] items-center space-x-2 border-b-2 border-black px-3"
        )}
      >
        <Input value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className={cn("btn-outline btn-sm btn-circle btn")}>
          <RiPencilLine />
        </button>
      </div>

      <div className={"flex w-full flex-col overflow-auto p-3"}>
        {chatrooms.isLoading ? (
          <RadialProgress className={"self-center"} />
        ) : (
          chatrooms.data?.map((chatroom) => {
            return (
              <ThreadListItem
                chatroomId={chatroom.id}
                key={chatroom.id}
                selected={chatroomId === chatroom.id}
                // TODO: setup page to let user fill in important details
                name={chatroom.users
                  .map((author) => author?.firstName)
                  .filter(notEmpty)
                  .join(", ")}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
