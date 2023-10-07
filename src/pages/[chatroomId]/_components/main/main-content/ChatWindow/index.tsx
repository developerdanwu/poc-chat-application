import React, { forwardRef } from 'react';
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
import { GroupedVirtuoso } from 'react-virtuoso';
import StartOfDirectMessage from '@/pages/[chatroomId]/_components/main/main-content/ChatWindow/StartOfDirectMessage';
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
  const { filterAuthedUserFromChatroomAuthors } = useApiTransformUtils();
  const {
    messages,
    groupedMessages,
    groupedMessagesKeys,
    groupedMessagesCount,
    messagesQuery,
    messagesCountQuery,
  } = useChatroomMessages({ chatroomId });

  // TODO: hardcode for now
  // const [firstItemIndex, setFirstItemIndex] = useState(69 - 1);

  const user = useUser();
  const chatroomDetails = api.chatroom.getChatroom.useQuery({
    chatroomId: chatroomId,
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
  const testing =
    messagesQuery.data?.pages.length > 0
      ? (messagesQuery.data?.pages.length - 1) * 20
      : 0;
  const firstItemIndex =
    messagesCountQuery.data?.messages_count -
    1 +
    (groupedMessagesCount?.length * 4 - 1) -
    testing;

  if (!chatroomDetails.data || !authorsHashmap) {
    return <div className="flex w-full flex-grow flex-col " />;
  }

  if (!messagesCountQuery.data || !messagesQuery.data) {
    return null;
  }

  console.log('FIRST INDEX', firstItemIndex);

  return (
    <GroupedVirtuoso
      firstItemIndex={firstItemIndex}
      initialTopMostItemIndex={0}
      data={messages}
      groupCounts={groupedMessagesCount}
      startReached={async () => {
        if (messagesQuery.hasNextPage) {
          await messagesQuery.fetchNextPage();
          // setFirstItemIndex((prev) => prev - 20);
        }
      }}
      components={{
        Header: () => {
          if (!messagesQuery.hasNextPage) {
            return (
              <StartOfDirectMessage
                chatroomType={chatroomDetails.data.type}
                authors={filteredChatroomUsers}
              />
            );
          }
        },
      }}
      style={{ height: '100%', flex: '0 1 auto', position: 'relative' }}
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
      itemContent={(index, groupIndex, message, context) => {
        const author = authorsHashmap[message.author_id];
        if (!author) {
          throw new Error('author not found');
        }
        const isSentByMe = author.user_id === user.user?.id;
        const previousMessage = message?.previousMessage;
        const previousMessageAuthor = previousMessage
          ? authorsHashmap[previousMessage.author_id]
          : undefined;

        const differenceBetweenLastMessage = previousMessage
          ? dayjs
              .utc(message.created_at)
              .diff(dayjs.utc(previousMessage.created_at), 'minute')
          : undefined;
        console.log(
          'DIFF',

          differenceBetweenLastMessage,
          message.client_message_id,
          message.created_at,
          previousMessage?.client_message_id,
          previousMessage?.created_at
        );

        const isLastMessageSenderEqualToCurrentMessageSender =
          previousMessageAuthor?.author_id === author.author_id;
        return (
          <>
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
          </>
        );
      }}
    />
  );
});

ChatWindow.displayName = 'ChatWindow';

export default ChatWindow;
