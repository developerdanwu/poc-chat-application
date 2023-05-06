import React, { useEffect, useRef } from "react";
import { api } from "@/utils/api";
import { useUser } from "@clerk/nextjs";
import ScrollArea from "@/components/elements/ScrollArea";
import ChatBubble from "@/components/templates/root/ChatBubble";
import { generateHTML } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { lowlight } from "lowlight";
import dayjs from "dayjs";

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
  const messages = api.messaging.getMessages.useQuery(
    {
      chatroomId: chatroomId ?? "",
    },
    {
      staleTime: Infinity,
      enabled: !!chatroomId,
    }
  );
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const listener = (event: Event) => {
      if (
        event.currentTarget instanceof HTMLElement &&
        event.target instanceof HTMLElement
      ) {
        const sentBy = event.target.getAttribute("data-communicator");

        event.currentTarget.scroll({
          top: event.currentTarget.scrollHeight,
          behavior: "smooth",
        });
      }
    };
    if (scrollAreaRef.current) {
      scrollAreaRef.current.addEventListener("DOMNodeInserted", listener);
    }

    return () => {
      if (scrollAreaRef.current) {
        scrollAreaRef.current.removeEventListener(
          "DOMNodeInserted",
          listener,
          false
        );
      }
    };
  }, []);

  return (
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
      <div className={"flex flex-col space-y-4 px-6 py-3"}>
        {messages.data?.messages.map((m) => {
          const isSentByMe = m.author.userId === user.user?.id;
          const content = safeGenerateMessageContent(m.content);

          return (
            <ChatBubble
              sendDate={dayjs(m.createdAt).toISOString()}
              variant={isSentByMe ? "sender" : "receiver"}
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
    </ScrollArea>
  );
};

export default ChatWindow;
