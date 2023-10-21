import React, { createRef, Fragment, useEffect, useRef, useState } from 'react';
import { cn, useApiTransformUtils } from '@/lib/utils';
import { type RouterOutput } from '@/server/api/root';
import { GroupedVirtuoso, type GroupedVirtuosoHandle } from 'react-virtuoso';
import { type MotionValue, useMotionValue } from 'framer-motion';
import { useChatroomMessages } from '@/pages/[chatroomId]/_components/main/main-content/ChatWindow/hooks';
import { useUser } from '@clerk/nextjs';
import { api } from '@/lib/api';
import {
  AiOutlineArrowDown,
  AiOutlineArrowUp,
  AiOutlineClose,
  AiOutlineSync,
} from 'react-icons/ai';
import dayjs from 'dayjs';
import { create } from 'zustand';
import { ChatWindowItem } from '@/pages/[chatroomId]/_components/main/main-content/ChatWindow/chat-reply-item';
import { useLatest } from 'react-use';
import { createPortal } from 'react-dom';
import {
  ChatHeader,
  ChatItemSkeleton,
  ChatScroller,
  TopItemList,
} from '@/pages/[chatroomId]/_components/main/main-content/ChatWindow/virtual-list-components';

const CHATWINDOW_TOP_THRESHOLD = 50;

export type ChatWindowRef = {
  scrollToBottom: () => void;
  scrollAreaRef: HTMLDivElement;
};

export type ChatWindowVirtualListContext = {
  isScrolling: boolean;
  virtualListWrapperRef: React.RefObject<HTMLDivElement>;
  unreadCount?: number;
  firstItemIndex?: number;
  chatroomId?: string;
  hasNextPage?: boolean;
  filteredChatroomUsers?: RouterOutput['chatroom']['getChatroom']['authors'];
  groupedMessagesKeys: string[];
  topHeight: MotionValue<number>;
};

export const useChatroomState = create<{
  newMessageScrollDirection: Record<string, 'up' | 'down' | 'in-view'>;
  syncMessagesRef: React.RefObject<HTMLDivElement>;
  setNewMessageScrollDirection: (
    chatroomId: string,
    value: 'up' | 'down' | 'in-view'
  ) => void;
  setSentNewMessage: (chatroomId: string, value: boolean) => void;
  sentNewMessage: Record<string, boolean>;
  setReceivedNewMessage: (chatroomId: string, value: boolean) => void;
  receivedNewMessage: Record<string, boolean>;
}>((setState) => ({
  newMessageScrollDirection: {},
  setNewMessageScrollDirection: (chatroomId, value) => {
    setState((state) => ({
      newMessageScrollDirection: {
        ...state.newMessageScrollDirection,
        [chatroomId]: value,
      },
    }));
  },
  receivedNewMessage: {},
  sentNewMessage: {},
  syncMessagesRef: createRef(),
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

const ChatWindow = function <T>({
  chatroomId,
  chatroomState,
  slotProps,
}: {
  chatroomState: {
    chatroomSyncRef: React.RefObject<HTMLDivElement>;
    setNewMessageScrollDirection: (
      chatroomId: string,
      value: 'up' | 'down' | 'in-view'
    ) => void;
    newMessageScrollDirection: Record<string, 'up' | 'down' | 'in-view'>;
    setSentNewMessage: (chatroomId: string, value: boolean) => void;
    sentNewMessage: Record<string, boolean>;
    setReceivedNewMessage: (chatroomId: string, value: boolean) => void;
    receivedNewMessage: Record<string, boolean>;
  };
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
  const {
    messages,
    groupedMessagesKeys,
    groupedMessagesCount,
    messagesQuery,
    messagesCountQuery,
  } = useChatroomMessages({ chatroomId });
  const [renderedRange, setRenderedRange] = useState<{
    startIndex: number;
    endIndex: number;
  }>({
    startIndex: 0,
    endIndex: 0,
  });
  const trpcContext = api.useContext();
  const readAllMessages = api.messaging.readAllMessages.useMutation({
    onSuccess: () => {
      if (chatroomId) {
        trpcContext.chatroom.getChatroom.invalidate({
          chatroomId: chatroomId,
        });
      }
    },
  });
  const [firstItemIndex, setFirstItemIndex] = useState(10000000);
  const { filterAuthedUserFromChatroomAuthors } = useApiTransformUtils();
  const virtualListWrapperRef = useRef<HTMLDivElement>(null);
  const virtualListRef = useRef<GroupedVirtuosoHandle>(null);
  const listHeight = useRef<number>(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const isScrollingLatest = useLatest(isScrolling);
  const user = useUser();
  const newMessageScrollDirection =
    chatroomState.newMessageScrollDirection[chatroomId!];
  const topHeight = useMotionValue(-1000);
  const latestSentNewMessage = useLatest(
    chatroomId ? chatroomState.sentNewMessage[chatroomId] : undefined
  );
  const latestRecievedNewMessage = useLatest(
    chatroomId ? chatroomState.receivedNewMessage[chatroomId] : undefined
  );
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

  const chatroom = api.chatroom.getChatroom.useQuery(
    {
      chatroomId: chatroomId!,
    },
    {
      enabled: !!chatroomId,
      select: (data) => {
        return {
          firstUnreadMessage: data.first_unread_message,
          filteredChatroomUsers: filterAuthedUserFromChatroomAuthors(
            data?.authors ?? []
          ),
          unreadCount: data.unread_count,
        };
      },
    }
  );

  const filteredChatroomUsers = chatroom.data?.filteredChatroomUsers;
  const firstUnreadMessage = chatroom.data?.firstUnreadMessage;
  const firstUnreadMessageIndex = messages?.findIndex((m) => {
    return m.client_message_id === firstUnreadMessage?.client_message_id;
  });
  const unreadCount = chatroom.data?.unreadCount;
  const scrollTop = () => {
    if (messagesCountQuery.data) {
      return messagesCountQuery.data?.messages_count > 0
        ? messagesCountQuery.data?.messages_count - 1
        : 0;
    }
    return 0;
  };

  // control the new message indicator
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (firstUnreadMessageIndex && firstUnreadMessageIndex !== -1) {
      if (
        renderedRange.startIndex < firstUnreadMessageIndex &&
        firstUnreadMessageIndex < renderedRange.endIndex &&
        chatroomId
      ) {
        timeout = setTimeout(() => {
          chatroomState.setNewMessageScrollDirection(chatroomId, 'in-view');
        }, 300);
      } else if (
        firstUnreadMessageIndex < renderedRange.startIndex &&
        chatroomId
      ) {
        chatroomState.setNewMessageScrollDirection(chatroomId, 'up');
      } else if (
        firstUnreadMessageIndex > renderedRange.endIndex &&
        chatroomId
      ) {
        chatroomState.setNewMessageScrollDirection(chatroomId, 'down');
      }
    }

    return () => {
      clearTimeout(timeout);
    };
  }, [renderedRange, firstUnreadMessageIndex, chatroomId, isScrolling]);

  useEffect(() => {
    if (chatroomId) {
      trpcContext.chatroom.getChatroom.invalidate({
        chatroomId,
      });
      trpcContext.messaging.getMessagesCount.invalidate({
        chatroomId,
      });
      trpcContext.messaging.getMessages.fetchInfinite({
        chatroomId,
      });
    }

    if (virtualListRef.current && chatroomId) {
      const firstUnreadMessage = chatroom.data?.firstUnreadMessage;

      if (firstUnreadMessage) {
        const firstUnreadMessageIndex = messages?.findIndex((m) => {
          return m.client_message_id === firstUnreadMessage?.client_message_id;
        });

        if (firstUnreadMessageIndex && firstUnreadMessageIndex !== -1) {
          virtualListRef.current?.scrollToIndex({
            index: firstUnreadMessageIndex,
          });
          return;
        }
      }
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
    <>
      {chatroomState.chatroomSyncRef.current &&
      (chatroom.isFetching ||
        messagesQuery.isFetching ||
        messagesCountQuery.isFetching)
        ? createPortal(
            <div>
              <AiOutlineSync className="animate-spin" />
            </div>,
            chatroomState.chatroomSyncRef.current
          )
        : null}
      <div
        className="relative h-0 w-full flex-[1_1_0px]"
        ref={virtualListWrapperRef}
      >
        {unreadCount &&
        unreadCount > 0 &&
        newMessageScrollDirection !== 'in-view' ? (
          <div className="absolute top-0 left-1/2 z-50 my-2 flex w-min -translate-x-1/2 justify-center bg-transparent">
            <button
              onClick={() => {
                if (messages) {
                  const firstUnreadMessageIndex = messages.findIndex((m) => {
                    return (
                      m.client_message_id ===
                      firstUnreadMessage?.client_message_id
                    );
                  });

                  // TODO: work out edge cases like lastUnReadMessage not loaded yet*/}
                  if (firstUnreadMessageIndex !== -1) {
                    virtualListRef.current?.scrollToIndex({
                      index: firstUnreadMessageIndex,
                    });
                  }
                }
              }}
            >
              <div
                className={cn(
                  'z-50 flex  w-max items-center justify-center space-x-1 self-center rounded-tl-full rounded-bl-full bg-red-500 py-0.5  px-3 text-white hover:bg-red-600'
                )}
              >
                {newMessageScrollDirection === 'up' ? (
                  <AiOutlineArrowUp size={12} />
                ) : (
                  <AiOutlineArrowDown size={12} />
                )}
                <p className="text-detail">{unreadCount} new messages</p>
              </div>
            </button>
            <button
              onClick={() => {
                if (chatroomId) {
                  readAllMessages.mutate({ chatroomId });
                }
              }}
              className="flex items-center justify-center rounded-br-full rounded-tr-full bg-red-500 px-3 text-white hover:bg-red-600"
            >
              <p className="text-detail">
                <AiOutlineClose />
              </p>
            </button>
          </div>
        ) : null}

        <GroupedVirtuoso<any, ChatWindowVirtualListContext | undefined>
          isScrolling={(value) => {
            setIsScrolling(value);
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
              if (latestSentNewMessage.current && isAtBottom) {
                chatroomState.setSentNewMessage(chatroomId, false);
                if (isScrollingLatest.current) {
                  return false;
                }
                return 'auto';
              }
              // sent new message scroll to bottom auto
              if (latestSentNewMessage.current) {
                chatroomState.setSentNewMessage(chatroomId, false);
                if (isScrollingLatest.current) {
                  return false;
                }
                return 'auto';
              }
              // TODO: receive new message && at bottom then scroll to bottom
              if (isAtBottom && latestRecievedNewMessage.current) {
                chatroomState.setReceivedNewMessage(chatroomId, false);
                if (isScrollingLatest.current) {
                  return false;
                }

                return 'auto';
              }
            }

            return false;
          }}
          firstItemIndex={firstItemIndex}
          initialTopMostItemIndex={scrollTop()}
          groupCounts={groupedMessagesCount || []}
          context={{
            isScrolling,
            virtualListWrapperRef,
            unreadCount,
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
            TopItemList,
          }}
          rangeChanged={(range) => {
            const originalStartIndex = range.startIndex - firstItemIndex!;
            const originalEndIndex = range.endIndex - firstItemIndex!;
            setRenderedRange({
              startIndex: originalStartIndex,
              endIndex: originalEndIndex,
            });
          }}
          style={{ height: '100%', position: 'relative' }}
          groupContent={(index, context) => {
            return (
              <div className="relative flex w-full justify-center bg-transparent ">
                <div
                  className={cn(
                    'left-[50%] z-50 my-2 w-max self-center rounded-full border border-slate-300 bg-white px-4 py-0.5 text-slate-700'
                  )}
                >
                  <p className="text-detail">
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

            const isFirstOfNewGroup =
              originalIndex - accumulatedIndex.prevAccumulatedIndex === 0;

            const message = messages?.[_index - firstItemIndex];

            if (!message) {
              return <ChatItemSkeleton />;
            }
            const isFirstUnreadMessage =
              firstUnreadMessage?.client_message_id ===
              message.client_message_id;
            if (message && authorsHashmap) {
              return (
                <ChatWindowItem
                  isScrolling={context!.isScrolling}
                  chatroomId={context!.chatroomId!}
                  virtualListWrapperRef={context!.virtualListWrapperRef}
                  isFirstOfNewGroup={isFirstOfNewGroup}
                  isFirstUnreadMessage={isFirstUnreadMessage}
                  authorsHashmap={authorsHashmap}
                  message={message}
                  user={user}
                />
              );
            }
          }}
        />
      </div>
    </>
  );
};

ChatWindow.displayName = 'ChatWindow';

export default ChatWindow;
