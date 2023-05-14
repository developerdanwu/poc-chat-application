import React, { useRef } from 'react';
import { api } from '@/utils/api';
import { generateHTML } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { lowlight } from 'lowlight';
import {
  useChatWindowLogic,
  useChatWindowScroll,
  useMessageUpdate,
} from '@/components/templates/root/ChatWindow/hooks';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import { cn, useApiTransformUtils } from '@/utils/utils';
import { useUser } from '@clerk/nextjs';
import utc from 'dayjs/plugin/utc';
import ChatReplyWrapper from '../ChatReplyWrapper';
import ChatContent from '@/components/templates/root/ChatContent';
import Avatar from '@/components/elements/Avatar';
import ScrollArea from '@/components/elements/ScrollArea';

dayjs.extend(advancedFormat);
dayjs.extend(utc);
const safeGenerateMessageContent = (content: any) => {
  try {
    return generateHTML(content, [
      StarterKit.configure({
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({
        HTMLAttributes: {
          spellcheck: 'false',
          autocomplete: 'false',
        },
        languageClassPrefix: 'codeblock-language-',
        lowlight,
      }),
    ]);
  } catch (e) {
    return false;
  }
};

const ChatWindow = ({ chatroomId }: { chatroomId: string }) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const chatWindowLogic = useChatWindowLogic({ chatroomId });
  const user = useUser();
  const chatroomDetails = api.messaging.getChatroom.useQuery({ chatroomId });
  const { filterAuthedUserFromChatroomAuthors, getFullName } =
    useApiTransformUtils();
  const filteredChatroomUsers = filterAuthedUserFromChatroomAuthors(
    chatroomDetails.data?.authors ?? []
  );
  const activeStickyIndexRef = useRef(0);

  const stickyIndexes = React.useMemo(
    () =>
      chatWindowLogic.messageGroupKeys.map((gn) =>
        chatWindowLogic.formattedMessages.findIndex((n) => n === gn)
      ),
    [chatWindowLogic.formattedMessages, chatWindowLogic.messageGroupKeys]
  );

  const isSticky = (index) => stickyIndexes.includes(index);
  const isActiveSticky = (index) => activeStickyIndexRef.current === index;

  // const rowVirtualizer = useVirtualizer({
  //   count: chatWindowLogic.formattedMessages.length,
  //   estimateSize: () => 100,
  //   overscan: 5,
  //   getScrollElement: () => scrollAreaRef.current,
  //   rangeExtractor: React.useCallback(
  //     (range) => {
  //       activeStickyIndexRef.current = [...stickyIndexes]
  //         .reverse()
  //         .find((index) => range.startIndex >= index);
  //
  //       const next = new Set([
  //         activeStickyIndexRef.current,
  //         ...defaultRangeExtractor(range),
  //       ]);
  //
  //       return [...next].sort((a, b) => a - b);
  //     },
  //     [stickyIndexes]
  //   ),
  // });

  // const virtualItems = rowVirtualizer.getVirtualItems();

  useMessageUpdate(chatroomId);
  useChatWindowScroll(scrollAreaRef);

  return (
    <ScrollArea
      componentProps={{
        root: {
          className:
            'flex overflow-hidden h-full w-full rounded-xl bg-base-100',
        },
        viewport: {
          ref: scrollAreaRef,
          className: 'h-full w-full',
        },
      }}
    >
      {!chatWindowLogic.messages.hasNextPage &&
        filteredChatroomUsers?.length === 1 && (
          <div className="flex flex-col px-6 pt-10">
            <Avatar alt="TE" size="lg" />
            <p className="pt-5 pb-2 text-xl font-bold">
              {filteredChatroomUsers?.length === 1
                ? getFullName({
                    firstName: filteredChatroomUsers[0]?.first_name,
                    lastName: filteredChatroomUsers[0]?.last_name,
                    fallback: 'Untitled',
                  })
                : ''}
            </p>
            <p className="text-sm text-warm-gray-400">
              This is the beginning of your message history with{' '}
              <span className="font-semibold">
                {filteredChatroomUsers?.length === 1
                  ? getFullName({
                      firstName: filteredChatroomUsers[0]?.first_name,
                      lastName: filteredChatroomUsers[0]?.last_name,
                      fallback: 'Untitled',
                    })
                  : ''}
              </span>
            </p>
          </div>
        )}

      {Object.entries(chatWindowLogic.messagesGroupedByDate || {})
        .sort((a, b) => (dayjs(a[0]).isBefore(dayjs(b[0])) ? 1 : -1))
        .map(([date, messages]) => {
          return (
            <div key={date} className={cn('flex flex-col space-y-4')}>
              <div
                className={cn(
                  'divider text-center text-sm font-semibold before:bg-warm-gray-400 after:bg-warm-gray-400'
                )}
              >
                {date}
              </div>
              {messages.reverse().map((m) => {
                const isSentByMe = m.author.user_id === user.user?.id;
                const content = safeGenerateMessageContent(
                  JSON.parse(m.content)
                );

                return (
                  <ChatReplyWrapper
                    sendDate={m.created_at}
                    variant={isSentByMe ? 'sender' : 'receiver'}
                    author={m.author}
                    key={m.client_message_id}
                  >
                    <ChatContent content={content} />
                  </ChatReplyWrapper>
                );
              })}
            </div>
          );
        })}
    </ScrollArea>
  );
};

export default ChatWindow;
