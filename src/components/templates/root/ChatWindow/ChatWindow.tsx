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
import { useVirtualizer, Virtualizer } from '@tanstack/react-virtual';
import { useIntersection } from 'react-use';
import ChatReplyWrapper from '@/components/templates/root/ChatReplyWrapper';
import ChatContent from '@/components/templates/root/ChatContent';
import ScrollArea from '@/components/elements/ScrollArea';
import Avatar from '@/components/elements/Avatar';

export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect;

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

  const intersectionRef = useRef(null);
  const inView = useIntersection(intersectionRef, {
    root: null,
    rootMargin: '0px',
    threshold: 1.0,
  });
  const count = chatWindowLogic.formattedMessages.length;
  const reverseIndex = React.useCallback((index) => count - 1 - index, [count]);
  const virtualizerRef =
    React.useRef<Virtualizer<HTMLDivElement, Element>>(null);
  console.log('PENIS', count, virtualizerRef.current?.options.count);

  if (
    virtualizerRef.current &&
    count !== virtualizerRef.current.options.count
  ) {
    const delta = count - virtualizerRef.current.options.count;
    const nextOffset = virtualizerRef.current.scrollOffset + delta * 100;

    virtualizerRef.current.scrollOffset = nextOffset;
    virtualizerRef.current.scrollToOffset(nextOffset, { align: 'start' });
  }

  const virtualizer = useVirtualizer({
    getScrollElement: () => scrollAreaRef.current,
    count: count,
    estimateSize: () => 100,
    overscan: 10,
    getItemKey: React.useCallback(
      (index) => {
        const item = chatWindowLogic.formattedMessages[reverseIndex(index)];
        if (typeof item === 'string') {
          return item;
        }

        return item.client_message_id;
      },
      [chatWindowLogic.formattedMessages, reverseIndex]
    ),
    scrollMargin: 50,
    // rangeExtractor: React.useCallback(
    //     (range) => {
    //       activeStickyIndexRef.current = [...stickyIndexes]
    //           .reverse()
    //           .find((index) => range.startIndex >= index);
    //
    //       const next = new Set([
    //         activeStickyIndexRef.current,
    //         ...defaultRangeExtractor(range),
    //       ]);
    //
    //       return [...next].sort((a, b) => a - b);
    //     },
    //     [stickyIndexes]
    // ),
  });

  useIsomorphicLayoutEffect(() => {
    virtualizerRef.current = virtualizer;
  });

  const virtualItems = virtualizer.getVirtualItems();

  const [paddingTop, paddingBottom] =
    virtualItems.length > 0
      ? [
          Math.max(0, virtualItems[0].start - virtualizer.options.scrollMargin),
          Math.max(
            0,
            virtualizer.getTotalSize() -
              virtualItems[virtualItems.length - 1].end
          ),
        ]
      : [0, 0];

  console.log(paddingBottom, paddingTop);

  React.useEffect(() => {
    if (inView?.isIntersecting) {
      chatWindowLogic.messages.fetchNextPage();
    }
  }, [inView?.isIntersecting, chatWindowLogic.messages]);

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

      {/*{!chatWindowLogic.messages.hasNextPage &&*/}
      {/*  filteredChatroomUsers?.length === 1 && (*/}
      {/*    <div className="flex flex-col px-6 pt-10">*/}
      {/*      <Avatar alt="TE" size="lg" />*/}
      {/*      <p className="pt-5 pb-2 text-xl font-bold">*/}
      {/*        {filteredChatroomUsers?.length === 1*/}
      {/*          ? getFullName({*/}
      {/*              firstName: filteredChatroomUsers[0]?.first_name,*/}
      {/*              lastName: filteredChatroomUsers[0]?.last_name,*/}
      {/*              fallback: 'Untitled',*/}
      {/*            })*/}
      {/*          : ''}*/}
      {/*      </p>*/}
      {/*      <p className="text-sm text-warm-gray-400">*/}
      {/*        This is the beginning of your message history with{' '}*/}
      {/*        <span className="font-semibold">*/}
      {/*          {filteredChatroomUsers?.length === 1*/}
      {/*            ? getFullName({*/}
      {/*                firstName: filteredChatroomUsers[0]?.first_name,*/}
      {/*                lastName: filteredChatroomUsers[0]?.last_name,*/}
      {/*                fallback: 'Untitled',*/}
      {/*              })*/}
      {/*            : ''}*/}
      {/*        </span>*/}
      {/*      </p>*/}
      {/*    </div>*/}
      {/*  )}*/}

      {/*
        loading intersection
      */}
      {chatWindowLogic.messages.hasNextPage && (
        <div
          ref={intersectionRef}
          style={{
            height: 50,
          }}
        >
          loading...
        </div>
      )}
      <div
        style={{
          overflowAnchor: 'none',
          paddingTop,
          paddingBottom,
        }}
      >
        {virtualItems.map((item) => {
          const index = reverseIndex(item.index);
          const targetItem = chatWindowLogic.formattedMessages[index];

          console.log('TARGET', targetItem);
          if (typeof targetItem === 'string') {
            return (
              <div
                key={item.key}
                data-index={item.index}
                data-reverse-index={index}
                ref={virtualizer.measureElement}
                className={cn(
                  'divider px-6 text-center text-sm font-semibold before:bg-warm-gray-400 after:bg-warm-gray-400'
                )}
              >
                {targetItem}
              </div>
            );
          }

          const isSentByMe = targetItem.author.user_id === user.user?.id;
          const content = safeGenerateMessageContent(
            JSON.parse(targetItem.content)
          );

          return (
            <div
              key={item.key}
              data-index={item.index}
              data-reverse-index={index}
              ref={virtualizer.measureElement}
              className={'px-6 py-2'}
            >
              <ChatReplyWrapper
                virtualizer={virtualizer}
                sendDate={targetItem.created_at}
                variant={isSentByMe ? 'sender' : 'receiver'}
                author={targetItem.author}
                key={targetItem.client_message_id}
              >
                <ChatContent content={content} />
              </ChatReplyWrapper>
            </div>
          );
        })}
      </div>

      {/*{Object.entries(chatWindowLogic.messagesGroupedByDate || {})*/}
      {/*  .sort((a, b) => (dayjs(a[0]).isBefore(dayjs(b[0])) ? 1 : -1))*/}
      {/*  .map(([date, messages]) => {*/}
      {/*    return (*/}
      {/*      <div key={date} className={cn('flex flex-col space-y-4')}>*/}
      {/*        <div*/}
      {/*          className={cn(*/}
      {/*            'divider text-center text-sm font-semibold before:bg-warm-gray-400 after:bg-warm-gray-400'*/}
      {/*          )}*/}
      {/*        >*/}
      {/*          {date}*/}
      {/*        </div>*/}
      {/*        {messages.reverse().map((m) => {*/}
      {/*          const isSentByMe = m.author.user_id === user.user?.id;*/}
      {/*          const content = safeGenerateMessageContent(*/}
      {/*            JSON.parse(m.content)*/}
      {/*          );*/}

      {/*          return (*/}
      {/*            <ChatReplyWrapper*/}
      {/*              sendDate={m.created_at}*/}
      {/*              variant={isSentByMe ? 'sender' : 'receiver'}*/}
      {/*              author={m.author}*/}
      {/*              key={m.client_message_id}*/}
      {/*            >*/}
      {/*              <ChatContent content={content} />*/}
      {/*            </ChatReplyWrapper>*/}
      {/*          );*/}
      {/*        })}*/}
      {/*      </div>*/}
      {/*    );*/}
      {/*  })}*/}
    </ScrollArea>
  );
};

export default ChatWindow;
