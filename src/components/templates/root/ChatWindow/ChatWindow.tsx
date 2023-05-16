import React, { useRef, useSyncExternalStore } from 'react';
import { api } from '@/utils/api';
import { generateHTML } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { lowlight } from 'lowlight';
import { useChatWindowLogic } from '@/components/templates/root/ChatWindow/hooks';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import { cn, useApiTransformUtils } from '@/utils/utils';
import { useUser } from '@clerk/nextjs';
import utc from 'dayjs/plugin/utc';
import { useVirtualizer, Virtualizer } from '@tanstack/react-virtual';
import { useIntersection } from 'react-use';
import ChatReplyWrapper from '@/components/templates/root/ChatReplyWrapper';
import ChatContent from '@/components/templates/root/ChatContent';
import ScrollArea from '@/components/elements/ScrollArea';
import Avatar from '@/components/elements/Avatar';
import { Controller, useFormContext } from 'react-hook-form';
import TextEditor from '@/components/modules/TextEditor/TextEditor';
import { getQueryKey } from '@trpc/react-query';
import produce from 'immer';
import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import { RouterOutput } from '@/server/api/root';
import { ChatForm } from '@/pages/[chatroomId]';
import ChatLoadingSkeleton from '@/components/templates/root/ChatWindow/ChatLoadingSkeleton';

export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect;

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

const ChatWindow = ({chatroomId}: { chatroomId: string }) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const chatWindowLogic = useChatWindowLogic({chatroomId});
  const user = useUser();
  const chatForm = useFormContext<ChatForm>();
  const queryClient = useQueryClient();
  const trpcUtils = api.useContext();

  const sendMessage = api.messaging.sendMessage.useMutation({
    onSettled: () => {
      queryClient.invalidateQueries(
          getQueryKey(
              api.messaging.getMessages,
              {
                chatroomId,
              },
              'infinite'
          )
      );
    },
    onMutate: (variables) => {
      const oldData = trpcUtils.messaging.getMessages.getInfiniteData({
        chatroomId,
      });
      trpcUtils.messaging.getMessages.setInfiniteData({chatroomId}, (old) => {
        if (!old) {
          return {
            pages: [{messages: [], next_cursor: 0}],
            pageParams: [],
          };
        }

        const newMessage = {
          client_message_id: old.pages[0]?.messages[0]?.client_message_id
              ? old.pages[0]?.messages[0]?.client_message_id + 1
              : 999,
          text: variables.text,
          content: variables.content,
          created_at: dayjs().utc().toISOString(),
          updated_at: dayjs().utc().toISOString(),
          author: {
            author_id: 999,
            user_id: user?.user?.id || '',
            first_name: user?.user?.firstName || '',
            last_name: user?.user?.lastName || '',
          },
        };

        if (old.pages.length === 0) {
          return {
            pages: [
              {
                messages: [newMessage],
                next_cursor: 0,
              },
            ],
            pageParams: [],
          };
        }

        const newState = produce(old.pages, (draft) => {
          draft[0]?.messages.unshift(newMessage);
          return draft;
        });

        return {
          pages: newState || [],
          pageParams: old.pageParams,
        };
      });
      chatForm.reset();
      virtualizer.scrollToIndex(count, {
        align: 'start',
      });
      setTimeout(() => {
        virtualizer.scrollToIndex(count, {
          align: 'start',
        });
      }, 200);
      return {
        oldData,
      };
    },
    onError: (error, variables, context) => {
      const contextCast = context as {
        oldData?: InfiniteData<RouterOutput['messaging']['getMessages']>;
      };
      if (contextCast.oldData) {
        trpcUtils.messaging.getMessages.setInfiniteData(
            {chatroomId},
            () => contextCast.oldData
        );
      }
    },
  });
  const chatroomDetails = api.messaging.getChatroom.useQuery({chatroomId});
  const {filterAuthedUserFromChatroomAuthors, getFullName} =
      useApiTransformUtils();
  const filteredChatroomUsers = filterAuthedUserFromChatroomAuthors(
      chatroomDetails.data?.authors ?? []
  );

  const intersectionRef = useRef<HTMLDivElement | null>(null);
  const inView = useIntersection(intersectionRef, {
    root: null,
    rootMargin: '10%',
    threshold: 0.2,
  });

  const count = chatWindowLogic.formattedMessages.length;
  const reverseIndex = React.useCallback(
      (index: number) => count - 1 - index,
      [count]
  );
  const virtualizerRef = React.useRef<Virtualizer<
      HTMLDivElement,
      Element
  > | null>(null);

  if (
      virtualizerRef.current &&
      count !== virtualizerRef.current.options.count
  ) {
    const delta = count - virtualizerRef.current.options.count;
    const nextOffset = virtualizerRef.current.scrollOffset + delta * 100;

    virtualizerRef.current.scrollOffset = nextOffset;
    virtualizerRef.current.scrollToOffset(nextOffset, {align: 'start'});
  }

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const virtualizer = useVirtualizer({
    getScrollElement: () => scrollAreaRef.current,
    count: count,
    estimateSize: () => 50,
    overscan: 5,
    getItemKey: (index) => {
      const item = chatWindowLogic.formattedMessages[reverseIndex(index)];
      if (!item) {
        return index;
      }

      if (typeof item === 'string') {
        return item;
      }

      return item.client_message_id;
    },
  });

  useIsomorphicLayoutEffect(() => {
    virtualizerRef.current = virtualizer;
  });

  const chatWindowSkeletonLoopNumber = useSyncExternalStore(
      (callback) => {
        window.addEventListener('resize', callback);
        return () => {
          window.removeEventListener('resize', callback);
        };
      },
      () => {
        if (scrollAreaRef.current) {
          return Math.ceil(
              scrollAreaRef.current.getBoundingClientRect().height / 250
          );
        }
        return 0;
      }
  );

  const virtualItems = virtualizer.getVirtualItems();

  const [paddingTop, paddingBottom] =
      virtualItems.length > 0
          ? [
            Math.max(
                0,
                (virtualItems[0]?.start ?? 0) - virtualizer.options.scrollMargin
            ),
            Math.max(
                0,
                virtualizer.getTotalSize() -
                (virtualItems[virtualItems?.length - 1]?.end ?? 0)
            ),
          ]
          : [0, 0];

  React.useEffect(() => {
    if (inView?.isIntersecting) {
      chatWindowLogic.messages.fetchNextPage();
    }
  }, [inView?.isIntersecting, chatWindowLogic.messages]);

  // useMessageUpdate(chatroomId);
  return (
      <>
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
          {!chatWindowLogic.messages.hasNextPage &&
              filteredChatroomUsers?.length === 1 && (
                  <div className="flex flex-col px-6 pt-10">
                    <Avatar alt="TE" size="lg"/>
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
          {/*
        loading intersection
      */}
          {/*{chatWindowLogic.messages.hasNextPage && (*/}
          {/*  <div*/}
          {/*    // ref={intersectionRef}*/}
          {/*    className={'flex flex-col space-y-4 px-6 py-6'}*/}
          {/*  >*/}
          {/*    <ChatLoadingSkeleton />*/}
          {/*    <ChatLoadingSkeleton />*/}
          {/*    <ChatLoadingSkeleton />*/}
          {/*  </div>*/}
          {/*)}*/}
          <div
              style={{
                position: 'relative',
                overflowAnchor: 'none',
                paddingTop,
                paddingBottom,
              }}
          >
            {virtualItems.map((item) => {
              const index = reverseIndex(item.index);
              const targetItem = chatWindowLogic.formattedMessages[index];
              if (!targetItem) {
                return null;
              }

              if (targetItem === 'loading') {
                return (
                    <div
                        key={item.key}
                        ref={(el) => {
                          virtualizer.measureElement(el);
                          intersectionRef.current = el;
                        }}
                        data-index={item.index}
                        data-reverse-index={index}
                    >
                      <div className={'flex flex-col space-y-4 px-6 py-6'}
                      >
                        {Array.from(
                            {length: chatWindowSkeletonLoopNumber},
                            (_, index) => index
                        ).map((val) => {
                          return <ChatLoadingSkeleton key={val}/>;
                        })}
                      </div>

                    </div>
                );
              }

              if (typeof targetItem === 'string') {
                return (
                    <div
                        key={item.key}
                        data-index={item.index}
                        data-reverse-index={index}
                        ref={virtualizer.measureElement}
                        style={{}}
                        className={cn(
                            'divider px-6 text-center text-sm font-semibold before:bg-warm-gray-400 after:bg-warm-gray-400'
                        )}
                    >
                      {targetItem}
                    </div>
                );
              }

              const isSentByMe = targetItem.author.user_id === user.user?.id;
              const content = safeGenerateMessageContent(
                  JSON.parse(targetItem.content)
              );

              return (
                  <div
                      key={item.key}
                      data-index={item.index}
                      data-reverse-index={index}
                      ref={virtualizer.measureElement}
                      className={'px-6 py-2'}
                  >
                    <ChatReplyWrapper
                        sendDate={targetItem.created_at}
                        variant={isSentByMe ? 'sender' : 'receiver'}
                        author={targetItem.author}
                        key={targetItem.client_message_id}
                    >
                      <ChatContent content={content}/>
                    </ChatReplyWrapper>
                  </div>
              );
            })}
            <div ref={bottomRef}/>
          </div>
        </ScrollArea>
        <form
            id="message-text-input-form"
            className="flex w-full items-center justify-between space-x-4 bg-transparent bg-secondary px-6 py-3"
            onSubmit={chatForm.handleSubmit((data) => {
              sendMessage.mutate({
                ...data,
                content: JSON.stringify(data.content),
                chatroomId,
              });
            })}
        >
          <Controller
              control={chatForm.control}
              render={({field: {onChange, value}}) => {
                return (
                    <TextEditor
                        onClickEnter={() => {
                          chatForm.handleSubmit((data) => {
                            sendMessage.mutate({
                              ...data,
                              content: JSON.stringify(data.content),
                              chatroomId,
                            });
                          })();
                        }}
                        onChange={onChange}
                        content={value}
                    />
                );
              }}
              name="content"
          />
        </form>
      </>
  );
};

export default ChatWindow;
