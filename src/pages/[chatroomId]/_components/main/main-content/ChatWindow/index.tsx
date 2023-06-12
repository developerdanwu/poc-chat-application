import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { api } from '@/lib/api';
import ScrollArea from '@/components/elements/ScrollArea';
import dayjs from 'dayjs';
import { cn, useApiTransformUtils } from '@/lib/utils';
import { type RouterOutput } from '@/server/api/root';
import InfiniteScroll from 'react-infinite-scroller';
import { useUser } from '@clerk/nextjs';
import RadialProgress from '@/components/elements/RadialProgress';
import StartOfDirectMessage from '@/pages/[chatroomId]/_components/main/main-content/ChatWindow/StartOfDirectMessage';
import {
  useChatroomMessages,
  useMessageUpdate,
} from '@/pages/[chatroomId]/_components/main/main-content/ChatWindow/hooks';
import {
  ChatReplyItem,
  ChatReplyItemWrapper,
} from '@/pages/[chatroomId]/_components/main/main-content/ChatWindow/chat-reply-item';

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
  const { messages, formattedMessages } = useChatroomMessages({ chatroomId });
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

  if (!chatroomDetails.data || !authorsHashmap) {
    return <div className="flex w-full flex-[1_0_0] flex-col" />;
  }
  return (
    <div className="flex w-full flex-[1_0_0] flex-col">
      <div className="flex-[1_1_0]" />
      <ScrollArea
        componentProps={{
          root: {
            className: 'flex overflow-hidden w-full rounded-xl bg-base-100',
          },
          viewport: {
            ref: scrollAreaRef,
            className: 'h-full w-full',
          },
        }}
      >
        {!messages.hasNextPage && filteredChatroomUsers?.length > 0 ? (
          <StartOfDirectMessage
            chatroomType={chatroomDetails.data.type}
            authors={filteredChatroomUsers}
          />
        ) : null}
        <InfiniteScroll
          pageStart={0}
          className="flex flex-col py-3"
          hasMore={messages.hasNextPage}
          reversed={true}
          getScrollParent={() => {
            return scrollAreaRef.current;
          }}
          loadMore={() => {
            messages.fetchNextPage();
          }}
          isReverse={true}
          loader={<div className={'flex justify-center py-2'}>
              <RadialProgress />
            </div>}
          useWindow={false}
        >
          {Object.entries(formattedMessages || {})
            .sort((a, b) => {
              return dayjs(a[0]).isAfter(dayjs(b[0]), 'day') ? 1 : -1;
            })
            .map(([date, messages]) => {
              const reversedMessages = [...messages].reverse();
              return (
                <div
                  key={date}
                  className={cn(
                    'relative flex flex-col after:absolute after:top-[20px] after:w-full after:border-t after:border-slate-300 after:content-[""]'
                  )}
                >
                  <div
                    className={cn(
                      'sticky top-2 z-50 my-2 self-center rounded-full border border-slate-300 bg-white px-4 text-slate-700'
                    )}
                  >
                    <p className="text-body">
                      {dayjs(date).format('dddd, MMMM Do')}
                    </p>
                  </div>
                  {reversedMessages.map((m, index) => {
                    const author = authorsHashmap[m.author_id];
                    if (!author) {
                      throw new Error('author not found');
                    }
                    const isSentByMe = author.user_id === user.user?.id;

                    const previousMessage = reversedMessages[index - 1];
                    const previousMessageAuthor = previousMessage
                      ? authorsHashmap[previousMessage.author_id]
                      : undefined;

                    const differenceBetweenLastMessage = previousMessage
                      ? dayjs
                          .utc(m.created_at)
                          .diff(dayjs.utc(previousMessage.created_at), 'minute')
                      : undefined;

                    const isLastMessageSenderEqualToCurrentMessageSender =
                      previousMessageAuthor?.author_id === author.author_id;
                    return (
                      <ChatReplyItemWrapper
                        isLastMessageSenderEqualToCurrentMessageSender={
                          isLastMessageSenderEqualToCurrentMessageSender
                        }
                        sendDate={m.created_at}
                        differenceBetweenLastMessage={
                          differenceBetweenLastMessage
                        }
                        key={m.client_message_id}
                        author={author}
                        communicator={isSentByMe ? 'sender' : 'receiver'}
                      >
                        <ChatReplyItem
                          isLastMessageSenderEqualToCurrentMessageSender={
                            isLastMessageSenderEqualToCurrentMessageSender
                          }
                          differenceBetweenLastMessage={
                            differenceBetweenLastMessage
                          }
                          sendDate={m.created_at}
                          author={author}
                          text={m.text}
                          content={m.content}
                        />
                      </ChatReplyItemWrapper>
                    );
                  })}
                </div>
              );
            })}
        </InfiniteScroll>
        <div ref={chatBottomRef} />
      </ScrollArea>
    </div>
  );
});

ChatWindow.displayName = 'ChatWindow';

export default ChatWindow;
