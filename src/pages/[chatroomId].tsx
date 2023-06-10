import { type NextPageWithLayout } from '@/pages/_app';
import { cn } from '@/lib/utils';
import ChatSidebar from '@/components/modules/left-sidebar/ChatSidebar';
import React, { useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import ChatWindow, {
  type ChatWindowRef,
} from '@/components/modules/main/ChatWindow';
import { FormProvider, useForm } from 'react-hook-form';
import { api } from '@/lib/api';
import { zodResolver } from '@hookform/resolvers/zod';
import z from 'zod';
import dayjs from 'dayjs';
import produce from 'immer';
import { type InfiniteData } from '@tanstack/react-query';
import { type RouterOutput } from '@/server/api/root';
import { useMessageUpdate } from '@/components/modules/main/ChatWindow/hooks';
import { Extension } from '@tiptap/core';
import HookFormTiptapEditor from '@/components/modules/TextEditor/HookFormTiptapEditor';
import { EditorContent } from '@tiptap/react';
import EditorMenuBar from '@/components/modules/TextEditor/EditorMenuBar';
import ChatTopControls from '@/components/modules/main/ChatTopControls';

export const MainChatWrapper = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center overflow-hidden ">
      {children}
    </div>
  );
};

const ChatroomId: NextPageWithLayout = () => {
  const router = useRouter();
  const chatroomId =
    typeof router.query.chatroomId === 'string' ? router.query.chatroomId : '';
  const trpcUtils = api.useContext();
  const chatWindowRef = useRef<ChatWindowRef>(null);
  const chatFormRef = useRef<HTMLFormElement>(null);
  const ownAuthor = api.messaging.getOwnAuthor.useQuery();
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
        if (!ownAuthor.data) {
          return old;
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
          author_id: ownAuthor.data.author_id,
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

      // not sure if this is the way to do this? But it will make sure the latest message is shown on screen on send message
      requestAnimationFrame(() => {
        chatWindowRef.current?.scrollToBottom();
      });

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
            ref={chatWindowRef}
            key={router.query.chatroomId}
            chatroomId={router.query.chatroomId}
          />
          <FormProvider {...chatForm}>
            <form
              ref={chatFormRef}
              id="message-text-input-form"
              className="flex w-full flex-none items-center justify-between space-x-4 bg-white px-6 py-3"
              onSubmit={chatForm.handleSubmit((data) => {
                sendMessage.mutate({
                  ...data,
                  content: JSON.stringify(data.content),
                  chatroomId,
                });
              })}
            >
              <HookFormTiptapEditor
                editorProps={{
                  attributes: {
                    class: cn(
                      'border-0 max-h-[55vh] overflow-auto w-full py-3'
                    ),
                  },
                }}
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
