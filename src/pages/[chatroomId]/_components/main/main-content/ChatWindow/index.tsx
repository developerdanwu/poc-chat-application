import React, { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import dayjs from 'dayjs';
import { cn, useApiTransformUtils } from '@/lib/utils';
import { type RouterOutput } from '@/server/api/root';
import { useUser } from '@clerk/nextjs';
import {
  useChatroomMessages,
  useMessageUpdate,
} from '@/pages/[chatroomId]/_components/main/main-content/ChatWindow/hooks';
import {
  GroupedVirtuoso,
  type GroupedVirtuosoHandle,
  type ScrollerProps,
} from 'react-virtuoso';
import StartOfDirectMessage from '@/pages/[chatroomId]/_components/main/main-content/ChatWindow/StartOfDirectMessage';
import {
  ChatReplyItem,
  ChatReplyItemWrapper,
} from '@/pages/[chatroomId]/_components/main/main-content/ChatWindow/chat-reply-item';
import { create } from 'zustand';
import { motion, type MotionValue, useMotionValue } from 'framer-motion';
import { Skeleton } from '@/components/elements/skeleton';

const CHATWINDOW_TOP_THRESHOLD = 50;

export type ChatWindowRef = {
  scrollToBottom: () => void;
  scrollAreaRef: HTMLDivElement;
};

export type ChatWindowVirtualListContext = {
  firstItemIndex?: number;
  chatroomId?: string;
  hasNextPage?: boolean;
  filteredChatroomUsers?: RouterOutput['chatroom']['getChatroom']['authors'];
  groupedMessagesKeys: string[];
  topHeight: MotionValue<number>;
};

export const useChatroomState = create<{
  chatroomWindowRefMap: Map<string, GroupedVirtuosoHandle>;
  setSentNewMessage: (chatroomId: string, value: boolean) => void;
  sentNewMessage: Record<string, boolean>;
  setReceivedNewMessage: (chatroomId: string, value: boolean) => void;
  receivedNewMessage: Record<string, boolean>;
}>((setState) => ({
  chatroomWindowRefMap: new Map(),
  receivedNewMessage: {},
  sentNewMessage: {},
  setReceivedNewMessage: (chatroomId, value) => {
    setState((state) => ({
      receivedNewMessage: { ...state.receivedNewMessage, [chatroomId]: value },
    }));
  },
  setSentNewMessage: (chatroomId, value) => {
    setState((state) => ({
      sentNewMessage: { ...state.sentNewMessage, [chatroomId]: value },
    }));
  },
}));

const ChatItemSkeleton = ({
  variant = 'one',
}: {
  variant?: 'one' | 'two' | 'three' | 'four';
}) => {
  return (
    <div className="flex space-x-3 py-2 px-6">
      <Skeleton className={cn('h-10 w-10 flex-shrink-0 rounded-full')} />
      <div className="mt-2 flex flex-shrink  flex-col space-y-3">
        <div className="flex space-x-1">
          <Skeleton className={cn(' h-2 w-20 rounded-full')} />
          <Skeleton className={cn('h-2 w-12 rounded-full')} />
        </div>
        <Skeleton
          className={cn('flex-shrink ', {
            'h-2 w-72 rounded-full': variant === 'one',
            'h-2 w-52 rounded-full': variant === 'two',
            'h-2 w-16 rounded-full': variant === 'three',
            'h-52 w-72': variant === 'four',
          })}
        />
      </div>
    </div>
  );
};

const ChatHeader = ({
  context,
}: {
  context?: ChatWindowVirtualListContext;
}) => {
  if (!context?.filteredChatroomUsers || context?.hasNextPage) {
    return (
      <>
        {Array(10)
          .fill(true)
          .map((_, index) => {
            if (index % 4 === 0) {
              return <ChatItemSkeleton key={index} variant="four" />;
            }
            if (index % 3 === 0) {
              return <ChatItemSkeleton key={index} variant="three" />;
            }
            if (index % 2 === 0) {
              return <ChatItemSkeleton key={index} variant="two" />;
            }
            return <ChatItemSkeleton key={index} variant="one" />;
          })}
      </>
    );
  }

  return <StartOfDirectMessage authors={context.filteredChatroomUsers} />;
};

const ChatScroller = React.forwardRef<
  HTMLDivElement,
  ScrollerProps & {
    context?: ChatWindowVirtualListContext;
  }
>(({ style, ...props }, ref) => {
  return (
    <motion.div
      ref={ref}
      style={{
        ...style,
        y: props.context?.topHeight,
      }}
      {...props}
    />
  );
});

ChatScroller.displayName = 'ChatScroller';

const ChatWindow = function <T>({
  chatroomId,
  slotProps,
}: {
  chatroomId?: string;
  slotProps?: {
    Virtuoso?: {
      context?: T;
      components: {
        Header: ({
          context,
        }: {
          context?: ChatWindowVirtualListContext & T;
        }) => JSX.Element;
      };
    };
  };
}) {
  useMessageUpdate({ chatroomId });
  const {
    messages,
    groupedMessagesKeys,
    groupedMessagesCount,
    messagesQuery,
    messagesCountQuery,
  } = useChatroomMessages({ chatroomId });
  // TODO fix this first item index so it calculates more reliably
  const [firstItemIndex, setFirstItemIndex] = useState(10000000);
  const isScrolling = useRef<boolean>(false);
  const { filterAuthedUserFromChatroomAuthors } = useApiTransformUtils();
  const virtualListWrapperRef = useRef<HTMLDivElement>(null);
  const virtualListRef = useRef<GroupedVirtuosoHandle>(null);
  const listHeight = useRef<number>(0);
  const chatroomState = useChatroomState((state) => ({
    chatroomWindowRefMap: state.chatroomWindowRefMap,
    sentNewMessage: state.sentNewMessage,
    setSentNewMessage: state.setSentNewMessage,
    receivedNewMessage: state.receivedNewMessage,
    setReceivedNewMessage: state.setReceivedNewMessage,
  }));
  const user = useUser();
  const topHeight = useMotionValue(-1000);

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === virtualListWrapperRef.current) {
          const calculatedTop =
            virtualListWrapperRef.current.getBoundingClientRect().height -
            listHeight.current;
          topHeight.set(calculatedTop > 0 ? calculatedTop : 0);
        }
      }
    });
    if (virtualListWrapperRef.current) {
      resizeObserver.observe(virtualListWrapperRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const authorsHashmap = api.chatroom.getChatroom.useQuery(
    {
      chatroomId: chatroomId!,
    },
    {
      enabled: !!chatroomId,
      select: (data) => {
        return data.authors.reduce<
          Record<
            string,
            RouterOutput['chatroom']['getChatroom']['authors'][number]
          >
        >((prevVal, author) => {
          prevVal[author.author_id] = author;
          return prevVal;
        }, {});
      },
    }
  ).data;

  const firstUnreadMessage = api.chatroom.getChatroom.useQuery(
    {
      chatroomId: chatroomId!,
    },
    {
      enabled: !!chatroomId,
      select: (data) => {
        return data.first_unread_message;
      },
    }
  ).data;

  const filteredChatroomUsers = api.chatroom.getChatroom.useQuery(
    {
      chatroomId: chatroomId!,
    },
    {
      enabled: !!chatroomId,
      select: (data) => {
        return filterAuthedUserFromChatroomAuthors(data?.authors ?? []);
      },
    }
  ).data;

  const scrollTop = () => {
    if (messagesCountQuery.data) {
      return messagesCountQuery.data?.messages_count > 0
        ? messagesCountQuery.data?.messages_count - 1
        : 0;
    }
    return 0;
  };

  useEffect(() => {
    if (virtualListRef.current && chatroomId) {
      virtualListRef.current?.autoscrollToBottom();
    }
  }, [chatroomId]);

  useEffect(() => {
    if (virtualListRef.current && virtualListWrapperRef.current) {
      const calculatedTop =
        virtualListWrapperRef.current?.getBoundingClientRect().height -
        listHeight.current;

      if (
        calculatedTop > -CHATWINDOW_TOP_THRESHOLD &&
        messagesQuery.hasNextPage
      ) {
        messagesQuery.fetchNextPage();
      }
    }
  }, [messagesQuery.hasNextPage, messagesQuery.data, topHeight, chatroomId]);

  return (
    <div className="h-0 w-full flex-[1_1_0px]" ref={virtualListWrapperRef}>
      <GroupedVirtuoso<any, ChatWindowVirtualListContext | undefined>
        isScrolling={(value) => {
          isScrolling.current = value;
        }}
        totalListHeightChanged={(height) => {
          listHeight.current = height;
          if (virtualListWrapperRef.current) {
            const calculatedTop =
              virtualListWrapperRef.current.getBoundingClientRect().height -
              height;
            topHeight.set(calculatedTop > 0 ? calculatedTop : 0);
          }
        }}
        id="chat-window"
        ref={virtualListRef}
        overscan={50}
        followOutput={(isAtBottom) => {
          // send message && close to bottom scroll smooth
          if (chatroomId) {
            if (chatroomState.sentNewMessage[chatroomId] && isAtBottom) {
              chatroomState.setSentNewMessage(chatroomId, false);
              if (isScrolling.current) {
                return false;
              }
              return 'smooth';
            }
            // sent new message scroll to bottom auto
            if (chatroomState.sentNewMessage[chatroomId]) {
              chatroomState.setSentNewMessage(chatroomId, false);
              if (isScrolling.current) {
                return false;
              }
              return 'auto';
            }
            // TODO: receive new message && at bottom then scroll to bottom
            if (isAtBottom && chatroomState.receivedNewMessage[chatroomId]) {
              chatroomState.setReceivedNewMessage(chatroomId, false);
              if (isScrolling.current) {
                return false;
              }
              return 'smooth';
            }
          }

          return false;
        }}
        firstItemIndex={firstItemIndex}
        initialTopMostItemIndex={scrollTop()}
        initialScrollTop={scrollTop()}
        groupCounts={groupedMessagesCount || []}
        context={{
          firstItemIndex,
          chatroomId,
          topHeight,
          groupedMessagesKeys,
          filteredChatroomUsers,
          hasNextPage: messagesQuery.hasNextPage,
          ...slotProps?.Virtuoso?.context,
        }}
        atTopThreshold={CHATWINDOW_TOP_THRESHOLD}
        atTopStateChange={(atTop) => {
          if (messagesQuery.hasNextPage && atTop) {
            messagesQuery.fetchNextPage();
            setFirstItemIndex((prevState) => prevState - 20);
          }
        }}
        // cannot pass data prop to grouped virtual list lib bug! https://github.com/petyosi/react-virtuoso/issues/608
        components={{
          // @ts-expect-error cannot infer types properly due to generic
          Header: slotProps?.Virtuoso?.components?.Header || ChatHeader,
          Scroller: ChatScroller,
        }}
        style={{ height: '100%', position: 'relative' }}
        groupContent={(index, context) => {
          return (
            <div className="relative flex w-full justify-center bg-transparent ">
              <div
                className={cn(
                  'left-[50%] z-50 my-2 w-max self-center rounded-full border border-slate-300 bg-white px-4 text-slate-700'
                )}
              >
                <p className="text-body">
                  {dayjs(context?.groupedMessagesKeys[index]).format(
                    'dddd, MMMM Do'
                  )}
                </p>
              </div>
            </div>
          );
        }}
        itemContent={(_index, _groupIndex, _data, context) => {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const originalIndex = _index - context!.firstItemIndex!;
          const accumulatedIndex = groupedMessagesCount?.reduce(
            (prevVal, nextVal, index) => {
              if (index <= _groupIndex) {
                prevVal.accumulatedIndex += nextVal;
              }
              if (index < _groupIndex) {
                prevVal.prevAccumulatedIndex += nextVal;
              }
              return prevVal;
            },
            {
              accumulatedIndex: 0,
              prevAccumulatedIndex: 0,
            }
          );

          if (!accumulatedIndex) {
            return <ChatItemSkeleton />;
          }
          const isStartOfGroup =
            accumulatedIndex.accumulatedIndex - 1 === originalIndex;
          const isFirstOfNewGroup =
            originalIndex - accumulatedIndex.prevAccumulatedIndex === 0;
          const isStartOfList = originalIndex === 0;
          const message = messages?.[_index - firstItemIndex];

          if (!message) {
            return <ChatItemSkeleton />;
          }
          const isFirstUnreadMessage =
            firstUnreadMessage?.client_message_id === message.client_message_id;
          const isEndOfList = originalIndex === messages.length - 1;
          if (message && authorsHashmap) {
            return (
              <ChatWindowItem
                isFirstOfNewGroup={isFirstOfNewGroup}
                isFirstUnreadMessage={isFirstUnreadMessage}
                isEndOfList={isEndOfList}
                isStartOfList={isStartOfList}
                isStartOfGroup={isStartOfGroup}
                authorsHashmap={authorsHashmap}
                message={message}
                user={user}
              />
            );
          }
        }}
      />
    </div>
  );
};

ChatWindow.displayName = 'ChatWindow';

const ChatWindowItem = React.memo(
  ({
    isFirstOfNewGroup,
    isFirstUnreadMessage,
    isEndOfList,
    isStartOfList,
    authorsHashmap,
    message,
    user,
    isStartOfGroup,
  }: {
    isFirstOfNewGroup: boolean;
    isFirstUnreadMessage: boolean;
    isEndOfList: boolean;
    isStartOfList: boolean;
    isStartOfGroup: boolean;
    authorsHashmap: Record<
      string,
      RouterOutput['chatroom']['getChatroom']['authors'][number]
    >;
    message: NonNullable<
      ReturnType<typeof useChatroomMessages>['messages']
    >[number];
    user: ReturnType<typeof useUser>;
  }) => {
    const author = authorsHashmap[message.author_id];
    if (!author) {
      throw new Error('author not found');
    }
    const isSentByMe = author.user_id === user.user?.id;
    const previousMessage = message?.previousMessage;
    const previousMessageAuthor = previousMessage
      ? authorsHashmap[previousMessage.author_id]
      : undefined;

    // TODO: AVATAR PLACEMENT DUE TO TIME IS BUGGED??
    const differenceBetweenLastMessage = previousMessage
      ? dayjs
          .utc(message.created_at)
          .local()
          .diff(dayjs.utc(previousMessage.created_at).local(), 'minute')
      : undefined;

    const isLastMessageSenderEqualToCurrentMessageSender =
      previousMessageAuthor?.author_id === author.author_id;
    return (
      <ChatReplyItemWrapper
        isFirstOfNewGroup={isFirstOfNewGroup}
        isFirstUnreadMessage={isFirstUnreadMessage}
        isEndOfList={isEndOfList}
        isStartOfList={isStartOfList}
        isStartOfGroup={isStartOfGroup}
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
          content={message.content}
        />
      </ChatReplyItemWrapper>
    );
  }
);

ChatWindowItem.displayName = 'ChatWindowItem';

export default ChatWindow;
