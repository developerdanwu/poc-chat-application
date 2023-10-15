import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
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

export type ChatWindowRef = {
  scrollToBottom: () => void;
  scrollAreaRef: HTMLDivElement;
};

type ChatWindowVirtualListContext = {
  context?: {
    hasNextPage?: boolean;
    filteredChatroomUsers: {
      author_id: number;
      first_name: string;
      last_name: string;
    }[];
    groupedMessagesKeys: string[];
    topHeight: MotionValue<number>;
  };
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

const ChatHeader = ({ context }: ChatWindowVirtualListContext) => {
  if (!context?.filteredChatroomUsers || context?.hasNextPage) {
    return (
      <div className="flex justify-center py-2">
        <RadialProgress />
      </div>
    );
  }

  return <StartOfDirectMessage authors={context.filteredChatroomUsers} />;
};

const ChatScroller = React.forwardRef<
  HTMLDivElement,
  ScrollerProps & ChatWindowVirtualListContext
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

const ChatWindow = forwardRef<
  ChatWindowRef,
  {
    chatroomId: string;
  }
>(({ chatroomId }, ref) => {
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
  const listHeight = useRef<number>(0);
  const chatroomState = useChatroomState((state) => ({
    chatroomWindowRefMap: state.chatroomWindowRefMap,
    sentNewMessage: state.sentNewMessage,
    setSentNewMessage: state.setSentNewMessage,
    receivedNewMessage: state.receivedNewMessage,
    setReceivedNewMessage: state.setReceivedNewMessage,
  }));
  const user = useUser();
  const topHeight = useMotionValue(0);

  useEffect(() => {
    return () => {
      chatroomState.chatroomWindowRefMap.delete(chatroomId);
    };
  }, [chatroomId, chatroomState.chatroomWindowRefMap]);

  useEffect(() => {
    const handler = () => {
      if (virtualListWrapperRef.current) {
        const calculatedTop =
          virtualListWrapperRef.current.getBoundingClientRect().height -
          listHeight.current;
        topHeight.set(calculatedTop > 0 ? calculatedTop : 0);
      }
    };
    window.addEventListener('resize', handler);
    return () => {
      window.removeEventListener('resize', handler);
    };
  }, []);

  const authorsHashmap = api.chatroom.getChatroom.useQuery(
    {
      chatroomId: chatroomId,
    },
    {
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

  const filteredChatroomUsers = api.chatroom.getChatroom.useQuery(
    {
      chatroomId: chatroomId,
    },
    {
      select: (data) => {
        return filterAuthedUserFromChatroomAuthors(data?.authors ?? []);
      },
    }
  ).data;

  if (
    !messagesCountQuery.data ||
    !messagesQuery.data ||
    !filteredChatroomUsers ||
    !authorsHashmap ||
    !groupedMessagesCount
  ) {
    return <ChatWindowLoading />;
  }
  // TODO: fix not reliable scroll to top and fetch?
  return (
    <div className="h-0 w-full flex-[1_1_0px]" ref={virtualListWrapperRef}>
      <GroupedVirtuoso
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
        key={chatroomId}
        ref={(ref) => {
          if (ref) {
            chatroomState.chatroomWindowRefMap.set(chatroomId, ref);
          }
        }}
        overscan={50}
        followOutput={(isAtBottom) => {
          // send message && close to bottom scroll smooth
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

          return false;
        }}
        firstItemIndex={firstItemIndex}
        initialTopMostItemIndex={
          messagesCountQuery.data?.messages_count > 0
            ? messagesCountQuery.data?.messages_count - 1
            : 0
        }
        initialScrollTop={
          messagesCountQuery.data?.messages_count > 0
            ? messagesCountQuery.data?.messages_count - 1
            : 0
        }
        groupCounts={groupedMessagesCount}
        context={{
          topHeight,
          groupedMessagesKeys,
          filteredChatroomUsers,
          hasNextPage: messagesQuery.hasNextPage,
        }}
        startReached={() => {
          if (messagesQuery.hasNextPage) {
            messagesQuery.fetchNextPage();
            setFirstItemIndex((prevState) => prevState - 20);
          }
        }}
        // cannot pass data prop to grouped virtual list lib bug! https://github.com/petyosi/react-virtuoso/issues/608
        components={{
          Header: ChatHeader,
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
                  {dayjs(context.groupedMessagesKeys[index]).format(
                    'dddd, MMMM Do'
                  )}
                </p>
              </div>
            </div>
          );
        }}
        itemContent={(_index, _groupIndex) => {
          const originalIndex = _index - firstItemIndex;
          const accumulatedIndex = groupedMessagesCount?.reduce(
            (prevVal, nextVal, index) => {
              if (index <= _groupIndex) {
                return (prevVal += nextVal);
              }
              return prevVal;
            },
            0
          );
          const isStartOfGroup = accumulatedIndex - 1 === originalIndex;
          const isStartOfList = originalIndex === 0;
          const message = messages?.[_index - firstItemIndex];
          if (!message) {
            return <div>UNSUPPORTED MESSAGE</div>;
          }
          const isEndOfList = originalIndex === messages.length - 1;
          if (message) {
            return (
              <ChatWindowItem
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
});

ChatWindow.displayName = 'ChatWindow';

const ChatWindowItem = React.memo(
  ({
    isEndOfList,
    isStartOfList,
    authorsHashmap,
    message,
    user,
    isStartOfGroup,
  }: {
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
