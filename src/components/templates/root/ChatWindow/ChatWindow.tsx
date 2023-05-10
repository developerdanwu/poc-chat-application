import React, { useRef } from "react";
import { api } from "@/utils/api";
import { useUser } from "@clerk/nextjs";
import ScrollArea from "@/components/elements/ScrollArea";
import { generateHTML } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { lowlight } from "lowlight";
import InfiniteScroll from "react-infinite-scroller";
import {
  useChatWindowScroll,
  useMessageUpdate,
} from "@/components/templates/root/ChatWindow/hooks";
import dayjs from "dayjs";
import { RouterOutput } from "@/server/api/root";
import advancedFormat from "dayjs/plugin/advancedFormat";
import ChatReplyWrapper from "@/components/templates/root/ChatReplyWrapper";
import { cn } from "@/utils/utils";
import ChatContent from "@/components/templates/root/ChatContent";
import Avatar from "@/components/elements/Avatar";

dayjs.extend(advancedFormat);

const safeGenerateMessageContent = (content: any) => {
  try {
    return generateHTML(content, [
      StarterKit.configure({
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({
        HTMLAttributes: {
          spellcheck: "false",
          autocomplete: "false",
        },
        languageClassPrefix: "codeblock-language-",
        lowlight,
      }),
    ]);
  } catch (e) {
    return false;
  }
};

const ChatWindow = ({ chatroomId }: { chatroomId: string }) => {
  const user = useUser();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const selfUser = useUser();
  const messages = api.messaging.getMessages.useInfiniteQuery(
    {
      chatroomId: chatroomId,
    },
    {
      getNextPageParam: (lastPage) => {
        return lastPage.nextCursor;
      },
      staleTime: Infinity,
      enabled: !!chatroomId,
    }
  );
  const chatroomDetails = api.messaging.getChatroom.useQuery({ chatroomId });
  const filteredChatroomUsers = chatroomDetails.data?.users.filter(
    (user) => user.userId !== selfUser.user?.id
  );

  const messagesArray = messages.data?.pages.reduce<
    RouterOutput["messaging"]["getMessages"]["messages"][number][]
  >((acc, nextVal) => {
    nextVal.messages.forEach((m) => {
      acc.push(m);
    });
    return acc;
  }, []);

  const formattedMessages = messagesArray?.reduce<
    Record<
      string,
      RouterOutput["messaging"]["getMessages"]["messages"][number][]
    >
  >((acc, nextVal) => {
    const date = dayjs(nextVal.createdAt).format("dddd, MMMM Do");
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date]!.push(nextVal);
    return acc;
  }, {});

  useMessageUpdate(chatroomId);
  useChatWindowScroll(scrollAreaRef);

  return (
    <ScrollArea
      componentProps={{
        root: {
          className:
            "flex overflow-hidden h-full w-full rounded-xl bg-base-100",
        },
        viewport: {
          ref: scrollAreaRef,
          className: "h-full w-full",
        },
      }}
    >
      {!messages.hasNextPage && filteredChatroomUsers?.length === 1 && (
        <div className={"flex flex-col px-6 pt-10"}>
          <Avatar alt={"TE"} size={"lg"} />
          <p className={"pt-5 pb-2 text-xl font-bold"}>
            {filteredChatroomUsers?.length === 1
              ? filteredChatroomUsers[0]?.firstName
              : ""}
          </p>
          <p className={"text-sm text-warm-gray-400"}>
            This is the beginning of your message history with{" "}
            <span className={"font-semibold"}>
              {filteredChatroomUsers?.length === 1
                ? filteredChatroomUsers[0]?.firstName
                : ""}
            </span>
          </p>
        </div>
      )}

      <InfiniteScroll
        pageStart={0}
        className={"flex flex-col space-y-4 px-6 py-3"}
        hasMore={messages.hasNextPage}
        reversed={true}
        getScrollParent={() => {
          return scrollAreaRef.current;
        }}
        loadMore={() => {
          messages.fetchNextPage();
        }}
        isReverse={true}
        loader={<div>LOADING</div>}
        useWindow={false}
      >
        {Object.entries(formattedMessages || {})
          .sort((a, b) => (dayjs(a[0]).isBefore(dayjs(b[0])) ? 1 : -1))
          .map(([date, messages]) => {
            return (
              <div key={date} className={cn("flex flex-col space-y-4")}>
                <div
                  className={cn(
                    "divider text-center text-sm font-semibold before:bg-warm-gray-400 after:bg-warm-gray-400"
                  )}
                >
                  {date}
                </div>
                {messages.reverse().map((m) => {
                  const isSentByMe = m.author.userId === user.user?.id;
                  const content = safeGenerateMessageContent(
                    JSON.parse(m.content)
                  );

                  return (
                    <ChatReplyWrapper
                      sendDate={dayjs(m.createdAt).toISOString()}
                      variant={isSentByMe ? "sender" : "receiver"}
                      author={m.author}
                      key={m.clientMessageId}
                    >
                      <ChatContent content={content} />
                    </ChatReplyWrapper>
                  );
                })}
              </div>
            );
          })}
      </InfiniteScroll>
    </ScrollArea>
  );
};

export default ChatWindow;
