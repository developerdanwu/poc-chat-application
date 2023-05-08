import React, { useState } from "react";
import { api } from "@/utils/api";
import { cn } from "@/utils/utils";
import Input from "@/components/elements/Input";
import ThreadListItem from "@/components/templates/root/ThreadListItem";
import { notEmpty } from "@/utils/ts-utils";
import { useRouter } from "next/router";
import { useDebounce } from "react-use";
import RadialProgress from "@/components/elements/RadialProgress";
import DropdownMenu from "@/components/elements/Dropdown";
import { RiPencilLine } from "react-icons/ri";
import Link from "next/link";

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

  const startNewChat = api.messaging.startNewChat.useMutation({
    onSuccess: (data) => {
      router.push(`/?chatroomId=${data}`);
    },
  });

  const allAuthors = api.messaging.getAllAuthors.useQuery({});

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
        <DropdownMenu
          componentProps={{
            contentProps: {
              align: "start",
            },
          }}
          renderButton={(setOpen) => (
            <button
              onClick={() => setOpen((prev) => !prev)}
              className={cn("btn-outline btn-sm btn-circle btn")}
            >
              <RiPencilLine />
            </button>
          )}
        >
          {(setOpen) => {
            return (
              <div
                className={
                  "flex min-w-[224px] flex-col space-y-2 rounded-md border-2 border-warm-gray-800 bg-warm-gray-50 p-3"
                }
              >
                <p className={"text-md font-semibold"}>Start conversation</p>
                <Input
                  className={"border border-warm-gray-800 bg-warm-gray-200"}
                />
                <div>
                  {allAuthors.data?.map((author) => {
                    return (
                      <button
                        key={author.authorId}
                        className={"w-full"}
                        onClick={() => {
                          startNewChat.mutate(
                            {
                              authorId: author.authorId,
                            },
                            {
                              onSuccess: () => {
                                setOpen(false);
                              },
                            }
                          );
                        }}
                      >
                        <ThreadListItem name={String(author.authorId)} />
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          }}
        </DropdownMenu>
      </div>

      <div className={"flex w-full flex-col overflow-auto p-3"}>
        {chatrooms.isLoading ? (
          <RadialProgress className={"self-center"} />
        ) : (
          chatrooms.data?.map((chatroom) => {
            return (
              <Link key={chatroom.id} href={`/?chatroomId=${chatroomId}`}>
                <ThreadListItem
                  selected={chatroomId === chatroom.id}
                  // TODO: setup page to let user fill in important details
                  name={chatroom.users
                    .map((author) => author?.firstName)
                    .filter(notEmpty)
                    .join(", ")}
                />
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
