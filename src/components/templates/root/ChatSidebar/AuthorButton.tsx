import React from "react";
import ThreadListItem from "@/components/templates/root/ThreadListItem";
import { RouterOutput } from "@/server/api/root";
import { api } from "@/utils/api";
import { useRouter } from "next/router";

const AuthorButton = ({
  author,
  onSuccess,
}: {
  onSuccess?: () => void;
  author: RouterOutput["messaging"]["getAllAuthors"][number];
}) => {
  const router = useRouter();
  const startNewChat = api.messaging.startNewChat.useMutation({
    onSuccess: (data) => {
      router.push(`/?chatroomId=${data}`);
    },
  });
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
              onSuccess?.();
            },
          }
        );
      }}
    >
      <ThreadListItem name={String(author.authorId)} />
    </button>
  );
};

export default AuthorButton;
