import { type NextPageWithLayout } from '@/pages/_app';
import { cn } from '@/lib/utils';
import ChatSidebar from '@/components/templates/root/ChatSidebar/ChatSidebar';
import React, { useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import ChatTopControls from '@/components/templates/root/ChatTopControls';
import ChatWindow from '@/components/templates/root/ChatWindow/ChatWindow';
import { FormProvider, useForm } from 'react-hook-form';
import { api } from '@/lib/api';
import { zodResolver } from '@hookform/resolvers/zod';
import z from 'zod';
import dayjs from 'dayjs';
import produce from 'immer';
import { type InfiniteData } from '@tanstack/react-query';
import { type RouterOutput } from '@/server/api/root';
import { useUser } from '@clerk/nextjs';
import { useMessageUpdate } from '@/components/templates/root/ChatWindow/hooks';
import { Extension } from '@tiptap/core';
import HookFormTiptapEditor from '@/components/modules/TextEditor/HookFormTiptapEditor';
import { EditorContent } from '@tiptap/react';
import TextEditorSendBar from '@/components/templates/root/TextEditorSendBar';
import EditorMenuBar from '@/components/modules/TextEditor/EditorMenuBar';

export const MainChatWrapper = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <div className="bg-warm-gray-50 flex h-full w-full flex-col items-center justify-center overflow-hidden ">
      {children}
    </div>
  );
};

const ChatroomId: NextPageWithLayout = () => {
  const router = useRouter();
  const chatroomId =
    typeof router.query.chatroomId === 'string' ? router.query.chatroomId : '';
  const trpcUtils = api.useContext();
  const user = useUser();
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const chatFormRef = useRef<HTMLFormElement>(null);
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

  useMessageUpdate({ chatroomId });

  const SubmitFormOnEnter = useMemo(
    () =>
      Extension.create({
        addKeyboardShortcuts() {
          return {
            Enter: () => {
              chatFormRef.current?.dispatchEvent(
                new Event('submit', { cancelable: true, bubbles: true })
              );
              return true;
            },
          };
        },
      }),
    []
  );

  const sendMessage = api.messaging.sendMessage.useMutation({
    mutationKey: ['sendMessage', chatroomId],
    onMutate: (variables) => {
      const oldData = trpcUtils.messaging.getMessages.getInfiniteData({
        chatroomId,
      });
      trpcUtils.messaging.getMessages.setInfiniteData({ chatroomId }, (old) => {
        if (!old) {
          return {
            pages: [{ messages: [], next_cursor: 0 }],
            pageParams: [],
          };
        }

        const flatMapMessages = old.pages.flatMap((page) => page.messages);

        const newMessage = {
          client_message_id:
            flatMapMessages.length > 0
              ? flatMapMessages[0]!.client_message_id + 1
              : 1,
          text: variables.text,
          content: variables.content,
          is_edited: false,
          created_at: dayjs.utc().toDate(),
          updated_at: dayjs.utc().toDate(),
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
          if (draft[0] && draft[0].messages.length < 10) {
            draft[0]?.messages.unshift(newMessage);
            return draft;
          }

          draft.unshift({
            messages: [newMessage],
            next_cursor: null as unknown as number,
          });

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

  return (
    <>
      {typeof router.query.chatroomId === 'string' && (
        <MainChatWrapper>
          <ChatTopControls chatroomId={chatroomId} />
          <ChatWindow
            chatBottomRef={chatBottomRef}
            key={router.query.chatroomId}
            chatroomId={router.query.chatroomId}
          />
          <FormProvider {...chatForm}>
            <form
              ref={chatFormRef}
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
              <HookFormTiptapEditor
                extensions={[SubmitFormOnEnter]}
                fieldName="content"
              >
                {(editor) => {
                  return (
                    <div
                      className={cn(
                        'border-warm-gray-400  group w-full rounded-lg border border-slate-300 px-3 py-3',
                        {
                          'border-slate-400': editor.isFocused,
                        }
                      )}
                    >
                      <EditorMenuBar editor={editor} />
                      <EditorContent editor={editor} />
                      <TextEditorSendBar />
                    </div>
                  );
                }}
              </HookFormTiptapEditor>
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
        'bg-warm-gray-50 flex h-screen w-screen flex-row items-center  justify-center'
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
