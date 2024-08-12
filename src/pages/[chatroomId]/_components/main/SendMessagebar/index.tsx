import React, { useRef } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { api } from "@/lib/api";
import dayjs from "dayjs";
import { type InfiniteData } from "@tanstack/react-query";
import { type RouterOutput } from "@/server/api/root";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { useChatroomState } from "@/pages/[chatroomId]/_components/main/main-content/ChatWindow";
import useChatroomUpdateUtils from "@/pages/[chatroomId]/_components/useChatroomUpdateUtils";
import { v4 as uuid } from "uuid";
import { useBroadcastEvent } from "../../../../../../liveblocks.config";
import SendMessageTextEditor from "@/pages/[chatroomId]/_components/main/SendMessagebar/SendMessageTextEditor";
import { useAblyStore } from "@/lib/ably";
import { EMPTY_RICH_TEXT } from "@/components/richtText/constants";

export const getAuthorsTypingTranslation = (
  typingAuthors: number[],
  authorsHashmap: Record<
    string,
    RouterOutput["chatroom"]["getChatroom"]["authors"][number]
  >
) => {
  console.log("hello");
  const UNKNOWN_AUTHOR = "Unknown";
  if (typingAuthors.length === 0) {
    return "";
  }
  if (typingAuthors.length === 1) {
    const authorId = typingAuthors[0] as number;
    return `${
      authorsHashmap[authorId]?.first_name ?? UNKNOWN_AUTHOR
    } is typing...`;
  }
  if (typingAuthors.length === 2) {
    const authorOneId = typingAuthors[0] as number;
    const authorTwoId = typingAuthors[1] as number;
    return `${authorsHashmap[authorOneId]?.first_name} and ${authorsHashmap[authorTwoId]?.first_name} are typing...`;
  }
  const authorId = typingAuthors[0] as number;
  return `${authorsHashmap[authorId]?.first_name} and ${
    typingAuthors.length - 1
  } others are typing...`;
};

const SendMessagebar = ({ chatroomId }: { chatroomId: string }) => {
  const chatroomUpdateUtils = useChatroomUpdateUtils();
  const chatroomState = useChatroomState((state) => ({
    setSentNewMessage: state.setSentNewMessage,
  }));
  const chatroomDetail = api.chatroom.getChatroom.useQuery(
    {
      chatroomId: chatroomId,
    },
    {
      enabled: !!chatroomId,
    }
  );
  const trpcUtils = api.useContext();
  const broadcast = useBroadcastEvent();
  const authorsHashmap = chatroomDetail.data?.authors.reduce<
    Record<string, RouterOutput["chatroom"]["getChatroom"]["authors"][number]>
  >((prevVal, author) => {
    prevVal[author.author_id] = author;
    return prevVal;
  }, {});
  const ownAuthor = api.chatroom.getOwnAuthor.useQuery();
  const chatFormRef = useRef<HTMLFormElement>(null);
  const ablyStore = useAblyStore((state) => ({
    typing: state.typing,
  }));
  const authorsInConversation = ablyStore.typing[chatroomId];
  const uniqueSortedAuthorsInConversation = [
    ...new Set(authorsInConversation),
  ].sort((a, b) => a - b);
  const chatForm = useForm({
    resolver: zodResolver(
      z.object({
        text: z.string().min(1),
        content: z.any(),
      })
    ),
    defaultValues: {
      text: "",
      content: JSON.stringify(EMPTY_RICH_TEXT),
    },
  });

  const sendMessage = api.messaging.sendMessage.useMutation({
    mutationKey: ["sendMessage", chatroomId],
    onMutate: (variables) => {
      const oldData = trpcUtils.messaging.getMessages.getInfiniteData({
        chatroomId,
      });

      const flatMapMessages = oldData?.pages.flatMap((page) => page.messages);

      if (flatMapMessages && ownAuthor.data) {
        chatroomUpdateUtils.updateMessages({
          message: {
            chatroom_id: variables.chatroomId,
            message_checksum: variables.messageChecksum,
            client_message_id:
              flatMapMessages.length > 0
                ? flatMapMessages[0]!.client_message_id + 1
                : 1,
            text: variables.text,
            content: variables.content,
            is_edited: false,
            created_at: dayjs.utc().toDate(),
            updated_at: dayjs.utc().toDate(),
            author_id: ownAuthor.data.author_id,
          },
        });
      }

      chatForm.reset();
      chatroomState.setSentNewMessage(variables.chatroomId, true);
      broadcast({
        type: "stopped_typing",
        data: {
          chatroom_id: chatroomId,
          author_id: ownAuthor.data!.author_id,
        },
      });

      return {
        oldData,
      };
    },
    onError: (error, variables, context) => {
      const contextCast = context as {
        oldData?: InfiniteData<RouterOutput["messaging"]["getMessages"]>;
      };
      if (contextCast.oldData) {
        trpcUtils.messaging.getMessages.setInfiniteData(
          { chatroomId },
          () => contextCast.oldData
        );
      }
    },
  });

  if (!ownAuthor.data || !authorsHashmap) {
    return null;
  }

  return (
    <FormProvider {...chatForm}>
      <form
        ref={chatFormRef}
        id="message-text-input-form"
        className="h-auto min-h-fit flex-shrink-0 overflow-hidden"
        onSubmit={chatForm.handleSubmit((data) => {
          sendMessage.mutate({
            ...data,
            content: JSON.stringify(data.content),
            chatroomId,
            messageChecksum: uuid(),
          });
        })}
      >
        <div className="flex flex-col px-6 ">
          <SendMessageTextEditor
            chatroomAuthors={chatroomDetail.data?.authors}
            chatroomId={chatroomId}
            chatFormRef={chatFormRef}
          />
          <p className="h-6 text-detail text-slate-500">
            {getAuthorsTypingTranslation(
              uniqueSortedAuthorsInConversation,
              authorsHashmap
            )}
          </p>
        </div>
      </form>
    </FormProvider>
  );
};

export default SendMessagebar;
