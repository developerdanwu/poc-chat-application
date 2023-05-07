import React, { useRef } from "react";
import { api } from "@/utils/api";
import { useUser } from "@clerk/nextjs";
import ScrollArea from "@/components/elements/ScrollArea";
import ChatBubble from "@/components/templates/root/ChatBubble";
import { generateHTML } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { lowlight } from "lowlight";
import dayjs from "dayjs";
import {
  useChatWindowScroll,
  useMessageUpdate,
} from "@/components/templates/root/ChatWindow/hooks";

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
  const messages = api.messaging.getMessages.useQuery(
    {
      chatroomId: chatroomId,
    },
    {
      staleTime: Infinity,
    }
  );
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
        <div className={"flex flex-col space-y-4 px-6 py-3"}>
          {messages.data?.messages.map((m) => {
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
      </ScrollArea>
    </>
  );
};

export default ChatWindow;
