import React from "react";
import { type RouterOutput } from "@/server/api/root";
import { api } from "@/utils/api";
import { useRouter } from "next/router";
import ThreadListItem from "@/components/templates/root/ThreadListItem";

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
      key={author.author_id}
      className="w-full"
      onClick={() => {
        startNewChat.mutate(
          {
            authorId: author.author_id,
          },
          {
            onSuccess: () => {
              onSuccess?.();
            },
          }
        );
      }}
    >
      <ThreadListItem
        helperText={`#${author.authorId}`}
        name={`${author.firstName} ${author.lastName}`}
      />
    </button>
  );
};

export default AuthorButton;
