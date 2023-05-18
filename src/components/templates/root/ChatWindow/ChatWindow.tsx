import React, { useRef, useState } from 'react';
import { api } from '@/utils/api';
import ScrollArea from '@/components/elements/ScrollArea';
import { generateHTML } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { lowlight } from 'lowlight';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import { cn, useApiTransformUtils } from '@/utils/utils';
import { type RouterOutput } from '@/server/api/root';
import Avatar from '@/components/elements/Avatar';
import InfiniteScroll from 'react-infinite-scroller';
import ChatReplyItem from '@/components/templates/root/ChatReplyItem';
import { useUser } from '@clerk/nextjs';
import utc from 'dayjs/plugin/utc';
import ChatReplyEditingItem from '@/components/templates/root/ChatWindow/ChatReplyEditingItem';
import ChatReplyItemWrapper from '@/components/templates/root/ChatWindow/ChatReplyItemWrapper';

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
      enabled: !!chatroomId,
    }
  );
  const chatroomDetails = api.messaging.getChatroom.useQuery({ chatroomId });
  const { filterAuthedUserFromChatroomAuthors, getFullName } =
    useApiTransformUtils();
  const filteredChatroomUsers = filterAuthedUserFromChatroomAuthors(
    chatroomDetails.data?.authors ?? []
  );

  const messagesArray = messages.data?.pages.reduce<
    RouterOutput['messaging']['getMessages']['messages']
  >((acc, nextVal) => {
    nextVal.messages.forEach((m) => {
      acc.push(m);
    });
    return acc;
  }, []);
  const user = useUser();

  const formattedMessages = messagesArray?.reduce<
    Record<string, RouterOutput['messaging']['getMessages']['messages']>
  >((acc, nextVal) => {
    const date = dayjs.utc(nextVal.created_at).local().format('dddd, MMMM Do');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date]!.push(nextVal);
    return acc;
  }, {});

  // useMessageUpdate(chatroomId);
  // useChatWindowScroll(scrollAreaRef);

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
      {!messages.hasNextPage && filteredChatroomUsers?.length === 1 && (
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
      <InfiniteScroll
        pageStart={0}
        className="flex flex-col space-y-4  py-3"
        hasMore={messages.hasNextPage}
        reversed={true}
        getScrollParent={() => {
          return scrollAreaRef.current;
        }}
        loadMore={() => {
          messages.fetchNextPage();
        }}
        isReverse={true}
        loader={<div>LOADING</div>}
        useWindow={false}
      >
        {Object.entries(formattedMessages || {})
          .sort((a, b) => (dayjs(a[0]).isBefore(dayjs(b[0])) ? 1 : -1))
          .map(([date, messages]) => {
            const messagesHashmap = messages.reduce<
              Record<
                string,
                RouterOutput['messaging']['getMessages']['messages'][number]
              >
            >((acc, nextVal) => {
              acc[nextVal.client_message_id] = nextVal;

              return acc;
            }, {});
            return (
              <div
                key={date}
                className={cn(
                  'relative flex flex-col after:absolute after:top-[10px] after:w-full after:border-t after:border-black after:content-[""]'
                )}
              >
                <div
                  className={cn(
                    'sticky top-2 z-50 self-center rounded-full border border-black bg-white px-4 text-sm font-semibold'
                  )}
                >
                  {date}
                </div>
                {messages.reverse().map((m) => {
                  const isSentByMe = m.author.user_id === user.user?.id;
                  const content = safeGenerateMessageContent(
                    JSON.parse(m.content)
                  );

                  const previousMessage =
                    messagesHashmap[m.client_message_id - 1];
                  const differenceBetweenLastMessage = previousMessage
                    ? dayjs(m.created_at).diff(
                        dayjs(previousMessage.created_at),
                        'minute'
                      )
                    : undefined;
                  return (
                    <ChatReplyItemWrapper
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
                          setIsEditing={setEditingChatItem}
                          content={content || m.text}
                        />
                      ) : (
                        <ChatReplyItem
                          differenceBetweenLastMessage={
                            differenceBetweenLastMessage
                          }
                          messageId={m.client_message_id}
                          setIsEditing={setEditingChatItem}
                          sendDate={m.created_at}
                          variant={isSentByMe ? 'sender' : 'receiver'}
                          author={m.author}
                          content={content || m.text}
                        />
                      )}
                    </ChatReplyItemWrapper>
                  );
                })}
              </div>
            );
          })}
      </InfiniteScroll>
    </ScrollArea>
  );
};

export default ChatWindow;
