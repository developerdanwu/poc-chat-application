import React, { forwardRef, useEffect } from 'react';
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
import { GroupedVirtuoso, type GroupedVirtuosoHandle } from 'react-virtuoso';
import StartOfDirectMessage from '@/pages/[chatroomId]/_components/main/main-content/ChatWindow/StartOfDirectMessage';
import {
  ChatReplyItem,
  ChatReplyItemWrapper,
} from '@/pages/[chatroomId]/_components/main/main-content/ChatWindow/chat-reply-item';
import { create } from 'zustand';
import { MESSAGES_PER_PAGE } from '@/pages/[chatroomId]/_components/main/main-content/ChatWindow/constants';

export type ChatWindowRef = {
  scrollToBottom: () => void;
  scrollAreaRef: HTMLDivElement;
};

export const useChatroomState = create<{
  chatroomWindowRefMap: Map<string, GroupedVirtuosoHandle>;
  setSentNewMessage: (chatroomId: string, value: boolean) => void;
  sentNewMessage: Record<string, boolean>;
}>((setState) => ({
  chatroomWindowRefMap: new Map(),
  sentNewMessage: {},
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

const ChatHeader = ({
  context,
}: {
  context?: {
    hasPreviousPage?: boolean;
    filteredChatroomUsers: {
      author_id: number;
      first_name: string;
      last_name: string;
    }[];
  };
}) => {
  if (!context?.filteredChatroomUsers || context?.hasPreviousPage) {
    return (
      <div className="flex justify-center py-2">
        <RadialProgress />
      </div>
    );
  }

  return <StartOfDirectMessage authors={context.filteredChatroomUsers} />;
};

const ChatWindow = forwardRef<
  ChatWindowRef,
  {
    chatroomId: string;
  }
>(({ chatroomId }, ref) => {
  useMessageUpdate({ chatroomId });
  const { filterAuthedUserFromChatroomAuthors } = useApiTransformUtils();
  const {
    messages,
    groupedMessagesKeys,
    groupedMessagesCount,
    messagesQuery,
    messagesCountQuery,
  } = useChatroomMessages({ chatroomId });
  const chatroomState = useChatroomState((state) => ({
    chatroomWindowRefMap: state.chatroomWindowRefMap,
    sentNewMessage: state.sentNewMessage,
    setSentNewMessage: state.setSentNewMessage,
  }));
  const user = useUser();

  useEffect(() => {
    return () => {
      chatroomState.chatroomWindowRefMap.delete(chatroomId);
    };
  }, [chatroomId, chatroomState.chatroomWindowRefMap]);
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
  const firstItemIndex =
    messagesCountQuery.data?.messages_count -
      1 +
      (groupedMessagesCount?.length * 4 - 1) -
      messagesQuery.data?.pages.length >
    0
      ? (messagesQuery.data?.pages.length - 1) * MESSAGES_PER_PAGE
      : 0;

  return (
    <GroupedVirtuoso
      key={chatroomId}
      ref={(ref) => {
        if (ref) {
          chatroomState.chatroomWindowRefMap.set(chatroomId, ref);
        }
      }}
      followOutput={(isAtBottom) => {
        // TODO: virtualisation is a bit bugged lol sometimes works sometimes no
        // send message && close to bottom scroll smooth
        if (chatroomState.sentNewMessage[chatroomId] && isAtBottom) {
          chatroomState.setSentNewMessage(chatroomId, false);
          return 'smooth';
        }
        // sent new message scroll to bottom auto
        if (chatroomState.sentNewMessage[chatroomId]) {
          chatroomState.setSentNewMessage(chatroomId, false);
          return 'auto';
        }
        // // receive new message && at bottom then scroll to bottom
        if (isAtBottom) {
          return 'smooth';
        }

        return false;
      }}
      firstItemIndex={firstItemIndex}
      initialTopMostItemIndex={messagesCountQuery.data?.messages_count - 1}
      data={messages}
      groupCounts={groupedMessagesCount}
      context={{
        filteredChatroomUsers,
        hasPreviousPage: messagesQuery.hasPreviousPage,
      }}
      startReached={() => {
        if (messagesQuery.hasPreviousPage) {
          // TODO: work out how to do the scrolling??
          messagesQuery.fetchPreviousPage();
        }
      }}
      components={{
        Header: ChatHeader,
      }}
      style={{ height: '100%', position: 'relative', flex: '1 1 0' }}
      groupContent={(index) => {
        return (
          <div className="relative flex w-full justify-center bg-transparent">
            <div
              className={cn(
                'left-[50%] z-50 my-2 w-max self-center rounded-full border border-slate-300 bg-white px-4 text-slate-700'
              )}
            >
              <p className="text-body">
                {dayjs(groupedMessagesKeys[index]).format('dddd, MMMM Do')}
              </p>
            </div>
          </div>
        );
      }}
      itemContent={(_index, _groupIndex, message) => {
        return (
          <ChatWindowItem
            authorsHashmap={authorsHashmap}
            message={message}
            user={user}
          />
        );
      }}
    />
  );
});

ChatWindow.displayName = 'ChatWindow';

const ChatWindowItem = React.memo(
  ({
    authorsHashmap,
    message,
    user,
  }: {
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
    const isStartOfGroup = previousMessage
      ? !dayjs
          .utc(message.created_at)
          .isSame(dayjs.utc(previousMessage.created_at), 'day')
      : true;
    // TODO: AVATAR PLACEMENT DUE TO TIME IS BUGGED??
    const differenceBetweenLastMessage = previousMessage
      ? dayjs
          .utc(message.created_at)
          .diff(dayjs.utc(previousMessage.created_at), 'minute')
      : undefined;

    const isLastMessageSenderEqualToCurrentMessageSender =
      previousMessageAuthor?.author_id === author.author_id;
    return (
      <ChatReplyItemWrapper
        isStartOfGroup={isStartOfGroup}
        isLastMessageSenderEqualToCurrentMessageSender={
          isLastMessageSenderEqualToCurrentMessageSender
        }
        sendDate={message.created_at}
        differenceBetweenLastMessage={
          isStartOfGroup ? Infinity : differenceBetweenLastMessage
        }
        key={message.client_message_id}
        author={author}
        communicator={isSentByMe ? 'sender' : 'receiver'}
      >
        <ChatReplyItem
          key={message.text}
          isLastMessageSenderEqualToCurrentMessageSender={
            isLastMessageSenderEqualToCurrentMessageSender
          }
          differenceBetweenLastMessage={
            isStartOfGroup ? Infinity : differenceBetweenLastMessage
          }
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
