import { NextPageWithLayout } from '@/pages/_app';
import { cn } from '@/utils/utils';
import ChatSidebar from '@/components/templates/root/ChatSidebar/ChatSidebar';
import React from 'react';
import { useRouter } from 'next/router';
import ChatTopControls from '@/components/templates/root/ChatTopControls';
import ChatWindow from '@/components/templates/root/ChatWindow/ChatWindow';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import TextEditor from '@/components/modules/TextEditor/TextEditor';
import { api } from '@/utils/api';
import { zodResolver } from '@hookform/resolvers/zod';
import z from 'zod';
import { getQueryKey } from '@trpc/react-query';
import dayjs from 'dayjs';
import produce from 'immer';
import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import { RouterOutput } from '@/server/api/root';
import { useUser } from '@clerk/nextjs';

export const MainChatWrapper = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <div
      className={
        'flex h-full w-full flex-col items-center justify-center overflow-hidden bg-warm-gray-50 '
      }
    >
      {children}
    </div>
  );
};

const ChatroomId: NextPageWithLayout = () => {
  const router = useRouter();
  const chatroomId =
    typeof router.query.chatroomId === 'string' ? router.query.chatroomId : '';
  const trpcUtils = api.useContext();
  const queryClient = useQueryClient();
  const user = useUser();
  const sendMessage = api.messaging.sendMessage.useMutation({
    onSettled: () => {
      queryClient.invalidateQueries(
        getQueryKey(
          api.messaging.getMessages,
          {
            chatroomId,
          },
          'query'
        )
      );
    },
    onMutate: (variables) => {
      const oldData = trpcUtils.messaging.getMessages.getInfiniteData({
        chatroomId,
      });
      trpcUtils.messaging.getMessages.setInfiniteData({ chatroomId }, (old) => {
        if (!old) {
          return {
            pages: [{ messages: [], next_cursor: null }],
            pageParams: [],
          };
        }

        const newMessage = {
          client_message_id:
            old.pages[old.pages.length - 1]?.messages?.[
              (old.pages?.[old.pages.length - 1]?.messages?.length ?? 1) - 1
            ]?.client_message_id || 999,
          text: variables.text,
          content: variables.content,
          created_at: dayjs().utc().toDate(),
          updated_at: dayjs().utc().toDate(),
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
                next_cursor: null,
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
          { chatroomId },
          () => contextCast.oldData
        );
      }
    },
  });

  const chatForm = useForm({
    resolver: zodResolver(
      z.object({
        text: z.string().min(1),
        content: z.any(),
      })
    ),
    defaultValues: {
      text: '',
      content: '',
    },
  });

  return (
    <>
      {typeof router.query.chatroomId === 'string' && (
        <MainChatWrapper>
          <ChatTopControls chatroomId={chatroomId} />
          <ChatWindow chatroomId={router.query.chatroomId} />
          <FormProvider {...chatForm}>
            <form
              id={'message-text-input-form'}
              className={
                'flex w-full items-center justify-between space-x-4 bg-transparent bg-secondary px-6 py-3'
              }
              onSubmit={chatForm.handleSubmit((data) => {
                sendMessage.mutate({
                  ...data,
                  chatroomId,
                });
              })}
            >
              <Controller
                control={chatForm.control}
                render={({ field: { onChange, value } }) => {
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
                name={'content'}
              />
            </form>
          </FormProvider>
        </MainChatWrapper>
      )}
    </>
  );
};

ChatroomId.getLayout = function getLayout(page) {
  return (
    <div
      className={cn(
        'flex h-screen w-screen flex-row items-center justify-center  bg-warm-gray-50'
      )}
    >
      <div className={cn('flex h-full w-full flex-row')}>
        <ChatSidebar />
        <MainChatWrapper>{page}</MainChatWrapper>
      </div>
    </div>
  );
};

export default ChatroomId;
