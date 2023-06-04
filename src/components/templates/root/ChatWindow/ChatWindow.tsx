import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { api } from '@/lib/api';
import ScrollArea from '@/components/elements/ScrollArea';
import dayjs from 'dayjs';
import { cn, useApiTransformUtils } from '@/lib/utils';
import { type RouterOutput } from '@/server/api/root';
import InfiniteScroll from 'react-infinite-scroller';
import ChatReplyItem from '@/components/templates/root/ChatReplyItem';
import { useUser } from '@clerk/nextjs';
import ChatReplyEditingItem from '@/components/templates/root/ChatWindow/ChatReplyEditingItem';
import ChatReplyItemWrapper from '@/components/templates/root/ChatWindow/ChatReplyItemWrapper';
import RadialProgress from '@/components/elements/RadialProgress';
import StartOfDirectMessage from '@/components/templates/root/ChatWindow/StartOfDirectMessage';

export type ChatWindowRef = {
  scrollToBottom: () => void;
  scrollAreaRef: HTMLDivElement;
};

const ChatWindow = forwardRef<
  ChatWindowRef,
  {
    chatroomId: string;
  }
>(({ chatroomId }, ref) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  //@ts-expect-error unknown type error
  useImperativeHandle(ref, () => {
    return {
      scrollAreaRef: scrollAreaRef.current,
      scrollToBottom: () => {
        chatBottomRef.current?.scrollIntoView();
      },
    };
  });
  const [editingChatItem, setEditingChatItem] = useState<undefined | number>(
    undefined
  );
  const messages = api.messaging.getMessages.useInfiniteQuery(
    {
      chatroomId: chatroomId,
    },
    {
      getNextPageParam: (lastPage) => {
        return lastPage?.next_cursor === 0 ? undefined : lastPage?.next_cursor;
      },
      staleTime: Infinity,
    }
  );
  const chatroomDetails = api.messaging.getChatroom.useQuery({
    chatroomId: chatroomId,
  });
  const { filterAuthedUserFromChatroomAuthors } = useApiTransformUtils();
  const filteredChatroomUsers = filterAuthedUserFromChatroomAuthors(
    chatroomDetails.data?.authors ?? []
  );
  const messagesArray = useMemo(
    () =>
      messages.data?.pages.reduce<
        RouterOutput['messaging']['getMessages']['messages']
      >((acc, nextVal) => {
        nextVal.messages.forEach((m) => {
          acc.push(m);
        });
        return acc;
      }, []),
    [messages.data?.pages]
  );
  const user = useUser();

  const formattedMessages = messagesArray?.reduce<
    Record<string, RouterOutput['messaging']['getMessages']['messages']>
  >((acc, nextVal) => {
    const date = dayjs
      .utc(nextVal.created_at)
      .local()
      .hour(0)
      .minute(0)
      .second(0)
      .format();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date]!.push(nextVal);
    return acc;
  }, {});

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
          <StartOfDirectMessage authors={filteredChatroomUsers} />
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
                    const isSentByMe = m.author.user_id === user.user?.id;

                    const previousMessage = reversedMessages[index - 1];

                    const differenceBetweenLastMessage = previousMessage
                      ? dayjs
                          .utc(m.created_at)
                          .diff(dayjs.utc(previousMessage.created_at), 'minute')
                      : undefined;

                    const isLastMessageSenderEqualToCurrentMessageSender =
                      previousMessage?.author.author_id === m.author.author_id;
                    return (
                      <ChatReplyItemWrapper
                        isLastMessageSenderEqualToCurrentMessageSender={
                          isLastMessageSenderEqualToCurrentMessageSender
                        }
                        sendDate={m.created_at}
                        differenceBetweenLastMessage={
                          differenceBetweenLastMessage
                        }
                        isEditing={editingChatItem === m.client_message_id}
                        key={m.client_message_id}
                        author={m.author}
                        communicator={isSentByMe ? 'sender' : 'receiver'}
                      >
                        {editingChatItem === m.client_message_id ? (
                          <ChatReplyEditingItem
                            chatroomId={chatroomId}
                            clientMessageId={m.client_message_id}
                            text={m.text}
                            setIsEditing={setEditingChatItem}
                            content={m.content}
                          />
                        ) : (
                          <ChatReplyItem
                            isLastMessageSenderEqualToCurrentMessageSender={
                              isLastMessageSenderEqualToCurrentMessageSender
                            }
                            differenceBetweenLastMessage={
                              differenceBetweenLastMessage
                            }
                            messageId={m.client_message_id}
                            isEdited={m.is_edited}
                            setIsEditing={setEditingChatItem}
                            sendDate={m.created_at}
                            variant={isSentByMe ? 'sender' : 'receiver'}
                            author={m.author}
                            text={m.text}
                            content={m.content}
                          />
                        )}
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
