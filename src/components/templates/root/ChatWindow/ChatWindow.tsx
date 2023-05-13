import React, { useRef } from 'react';
import { api } from '@/utils/api';
import ScrollArea from '@/components/elements/ScrollArea';
import { generateHTML } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { lowlight } from 'lowlight';
import {
  useChatWindowScroll,
  useMessageUpdate,
} from '@/components/templates/root/ChatWindow/hooks';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import { cn, useApiTransformUtils } from '@/utils/utils';
import { RouterOutput } from '@/server/api/root';
import Avatar from '@/components/elements/Avatar';
import InfiniteScroll from 'react-infinite-scroller';
import ChatReplyWrapper from '@/components/templates/root/ChatReplyWrapper';
import { useUser } from '@clerk/nextjs';
import ChatContent from '@/components/templates/root/ChatContent';

dayjs.extend(advancedFormat);

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
  const messages = api.messaging.getMessages.useInfiniteQuery(
    {
      chatroomId: chatroomId,
    },
    {
      getNextPageParam: (lastPage) => {
        return lastPage?.next_cursor;
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
    const date = dayjs(nextVal.created_at).format('dddd, MMMM Do');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date]!.push(nextVal);
    return acc;
  }, {});

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
      {!messages.hasNextPage && filteredChatroomUsers?.length === 1 && (
        <div className={'flex flex-col px-6 pt-10'}>
          <Avatar alt={'TE'} size={'lg'} />
          <p className={'pt-5 pb-2 text-xl font-bold'}>
            {filteredChatroomUsers?.length === 1
              ? getFullName({
                  firstName: filteredChatroomUsers[0]?.first_name,
                  lastName: filteredChatroomUsers[0]?.last_name,
                  fallback: 'Untitled',
                })
              : ''}
          </p>
          <p className={'text-sm text-warm-gray-400'}>
            This is the beginning of your message history with{' '}
            <span className={'font-semibold'}>
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
        className={'flex flex-col space-y-4 px-6 py-3'}
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
            return (
              <div key={date} className={cn('flex flex-col space-y-4')}>
                <div
                  className={cn(
                    'divider text-center text-sm font-semibold before:bg-warm-gray-400 after:bg-warm-gray-400'
                  )}
                >
                  {date}
                </div>
                {messages.reverse().map((m) => {
                  const isSentByMe = m.author.user_id === user.user?.id;
                  const content = safeGenerateMessageContent(
                    JSON.parse(m.content)
                  );

                  return (
                    <ChatReplyWrapper
                      sendDate={m.created_at}
                      variant={isSentByMe ? 'sender' : 'receiver'}
                      author={m.author}
                      key={m.client_message_id}
                    >
                      <ChatContent content={content} />
                    </ChatReplyWrapper>
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
