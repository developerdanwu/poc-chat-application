import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { api } from '@/lib/api';
import ScrollArea from '@/components/elements/ScrollArea';
import dayjs from 'dayjs';
import { cn, useApiTransformUtils } from '@/lib/utils';
import { type RouterOutput } from '@/server/api/root';
import { useUser } from '@clerk/nextjs';
import RadialProgress from '@/components/elements/RadialProgress';
import {
  useChatroomMessages,
  useMessageUpdate,
} from '@/pages/[chatroomId]/_components/main/main-content/ChatWindow/hooks';
import {
  ChatReplyItem,
  ChatReplyItemWrapper,
} from '@/pages/[chatroomId]/_components/main/main-content/ChatWindow/chat-reply-item';
import { GroupedVirtuoso } from 'react-virtuoso';

export type ChatWindowRef = {
  scrollToBottom: () => void;
  scrollAreaRef: HTMLDivElement;
};

export const ChatWindowLoading = () => {
  return (
    <div className="flex w-full flex-[1_0_0] flex-col">
      <div className="flex-[1_1_0]" />
      <div className="flex justify-center py-2">
        <RadialProgress />
      </div>
    </div>
  );
};

const ChatWindow = forwardRef<
  ChatWindowRef,
  {
    chatroomId: string;
  }
>(({ chatroomId }, ref) => {
  useMessageUpdate({ chatroomId });
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const { filterAuthedUserFromChatroomAuthors } = useApiTransformUtils();
  const {
    messages,
    groupedMessages,
    groupedMessagesKeys,
    groupedMessagesCount,
  } = useChatroomMessages({ chatroomId });
  const user = useUser();
  const chatroomDetails = api.chatroom.getChatroom.useQuery({
    chatroomId: chatroomId,
  });
  //@ts-expect-error unknown type error
  useImperativeHandle(ref, () => {
    return {
      scrollAreaRef: scrollAreaRef.current,
      scrollToBottom: () => {
        chatBottomRef.current?.scrollIntoView();
      },
    };
  });

  const authorsHashmap = chatroomDetails.data?.authors.reduce<
    Record<string, RouterOutput['chatroom']['getChatroom']['authors'][number]>
  >((prevVal, author) => {
    prevVal[author.author_id] = author;
    return prevVal;
  }, {});

  const filteredChatroomUsers = filterAuthedUserFromChatroomAuthors(
    chatroomDetails.data?.authors ?? []
  );

  const chatwindowEntries = Object.entries(groupedMessages || {}).sort(
    (a, b) => {
      return dayjs(a[0]).isAfter(dayjs(b[0]), 'day') ? 1 : -1;
    }
  );

  if (!chatroomDetails.data || !authorsHashmap) {
    return <div className="flex w-full flex-grow flex-col " />;
  }

  if (!messages) {
    return null;
  }

  return (
    <div className="flex h-full flex-grow flex-col overflow-hidden">
      <div className="flex-grow" />
      <ScrollArea
        slotProps={{
          root: {
            className: 'flex w-full rounded-xl bg-base-100 overflow-auto',
          },
          viewport: {
            ref: scrollAreaRef,
            className: 'h-full w-full',
          },
        }}
      >
        {/*{!messages.hasNextPage && filteredChatroomUsers?.length > 0 ? (*/}
        {/*  <StartOfDirectMessage*/}
        {/*    chatroomType={chatroomDetails.data.type}*/}
        {/*    authors={filteredChatroomUsers}*/}
        {/*  />*/}
        {/*) : null}*/}
        <GroupedVirtuoso
          style={{ height: 400 }}
          data={messages || []}
          groupContent={(index) => {
            return (
              <div
                className={cn(
                  'sticky top-2 z-50 my-2 self-center rounded-full border border-slate-300 bg-white px-4 text-slate-700'
                )}
              >
                <p className="text-body">
                  {dayjs(groupedMessagesKeys[index]).format('dddd, MMMM Do')}
                </p>
              </div>
            );
          }}
          itemContent={(index) => {
            const message = messages[index]!;

            const author = authorsHashmap[message.author_id];
            if (!author) {
              throw new Error('author not found');
            }
            const isSentByMe = author.user_id === user.user?.id;

            const previousMessage = messages[index - 1];
            const previousMessageAuthor = previousMessage
              ? authorsHashmap[previousMessage.author_id]
              : undefined;

            const differenceBetweenLastMessage = previousMessage
              ? dayjs
                  .utc(message.created_at)
                  .diff(dayjs.utc(previousMessage.created_at), 'minute')
              : undefined;

            const isLastMessageSenderEqualToCurrentMessageSender =
              previousMessageAuthor?.author_id === author.author_id;
            return (
              <ChatReplyItemWrapper
                isLastMessageSenderEqualToCurrentMessageSender={
                  isLastMessageSenderEqualToCurrentMessageSender
                }
                sendDate={message.created_at}
                differenceBetweenLastMessage={differenceBetweenLastMessage}
                key={message.client_message_id}
                author={author}
                communicator={isSentByMe ? 'sender' : 'receiver'}
              >
                <ChatReplyItem
                  key={message.text}
                  isLastMessageSenderEqualToCurrentMessageSender={
                    isLastMessageSenderEqualToCurrentMessageSender
                  }
                  differenceBetweenLastMessage={differenceBetweenLastMessage}
                  sendDate={message.created_at}
                  author={author}
                  text={message.text}
                  content={message.content}
                />
              </ChatReplyItemWrapper>
            );
          }}
        />
        {/*{chatwindowEntries.map(([date, messages]) => {*/}
        {/* */}
        {/*})}*/}

        {/*<div ref={chatBottomRef} />*/}
      </ScrollArea>
    </div>
  );
});

ChatWindow.displayName = 'ChatWindow';

export default ChatWindow;
