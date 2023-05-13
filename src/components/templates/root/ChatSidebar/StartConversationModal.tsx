import React, { useState } from "react";
import { cn } from "@/utils/utils";
import { RiPencilLine } from "react-icons/ri";
import Input from "@/components/elements/Input";
import AuthorButton from "@/components/templates/root/ChatSidebar/AuthorButton";
import DropdownMenu from "@/components/elements/Dropdown";
import { api } from "@/utils/api";
import { useDebounce } from "react-use";

const StartConversationModal = () => {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const allAuthors = api.messaging.getAllAuthors.useQuery({
    searchKeyword: debouncedSearch,
  });
  useDebounce(
    () => {
      setDebouncedSearch(search);
    },
    1000,
    [search]
  );
  return (
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
            className="flex min-w-[224px] flex-col space-y-2 rounded-md border-2 border-warm-gray-800 bg-warm-gray-50 p-3"
          >
            <p className="text-md font-semibold">Start conversation</p>
            <Input
              onChange={(e) => setSearch(e.target.value)}
              value={search}
              className="border border-warm-gray-800 bg-warm-gray-200"
            />
            <div>
              {allAuthors.data?.map((author) => {
                return (
                  <AuthorButton
                    key={author.author_id}
                    author={author}
                    onSuccess={() => {
                      setOpen(false);
                    }}
                  />
                );
              })}
            </div>
          </div>
        );
      }}
    </DropdownMenu>
  );
};

export default StartConversationModal;
