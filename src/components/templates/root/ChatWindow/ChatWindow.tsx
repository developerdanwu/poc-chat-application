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
import ChatBubble from "@/components/templates/root/ChatBubble";

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
  const infiniteScrollRef = useRef<HTMLDivElement>(null);
  const messages = api.messaging.getMessages.useInfiniteQuery(
    {
      chatroomId: chatroomId,
    },
    {
      getNextPageParam: (lastPage) => {
        console.log(lastPage.nextCursor);
        return lastPage.nextCursor;
      },
      staleTime: Infinity,
    }
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
    <>
      <ScrollArea
        componentProps={{
          root: {
            className:
              "flex overflow-hidden h-full w-full rounded-xl  bg-base-100",
          },
          viewport: {
            ref: scrollAreaRef,
            className: "h-full w-full",
          },
        }}
      >
        <InfiniteScroll
          pageStart={0}
          className={"flex flex-col space-y-4 px-6 py-3"}
          hasMore={messages.hasNextPage}
          loadMore={() => {
            messages.fetchNextPage();
          }}
          isReverse={true}
          loader={<div>LOADING</div>}
          useWindow={false}
        >
          {Object.entries(formattedMessages || {}).map(([date, messages]) => {
            return (
              <div key={date} className={"flex flex-col space-y-4"}>
                <div
                  className={
                    "divider text-center text-sm font-semibold before:bg-warm-gray-400 after:bg-warm-gray-400"
                  }
                >
                  {date}
                </div>
                {messages.map((m) => {
                  const isSentByMe = m.author.userId === user.user?.id;
                  const content = safeGenerateMessageContent(m.content);

                  return (
                    <ChatBubble
                      sendDate={dayjs(m.createdAt).toISOString()}
                      variant={isSentByMe ? "sender" : "receiver"}
                      author={m.author}
                      key={m.clientMessageId}
                    >
                      {content ? (
                        <div
                          dangerouslySetInnerHTML={{
                            __html: content,
                          }}
                        />
                      ) : (
                        m.text
                      )}
                    </ChatBubble>
                  );
                })}
              </div>
            );
          })}
        </InfiniteScroll>
      </ScrollArea>
    </>
  );
};

export default ChatWindow;
