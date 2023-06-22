import React, { type RefObject, useMemo, useRef } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import HookFormTiptapEditor from '@/components/elements/text-editor/HookFormTiptapEditor';
import { cn } from '@/lib/utils';
import EditorMenuBar from '@/components/elements/text-editor/EditorMenuBar';
import { EditorContent } from '@tiptap/react';
import { Extension } from '@tiptap/core';
import { api } from '@/lib/api';
import dayjs from 'dayjs';
import produce from 'immer';
import { type InfiniteData } from '@tanstack/react-query';
import { type RouterOutput } from '@/server/api/root';
import { zodResolver } from '@hookform/resolvers/zod';
import z from 'zod';
import { type ChatWindowRef } from '@/pages/[chatroomId]/_components/main/main-content/ChatWindow';

const SendMessagebar = ({
  chatroomId,
  chatWindowRef,
}: {
  chatroomId: string;
  chatWindowRef: RefObject<ChatWindowRef>;
}) => {
  const chatroomDetails = api.chatroom.getChatroom.useQuery({
    chatroomId: chatroomId,
  });
  const sendMessageToAI = api.messaging.sendMessageOpenAI.useMutation();

  const trpcUtils = api.useContext();
  const ownAuthor = api.chatroom.getOwnAuthor.useQuery();
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
              class: cn('border-0 max-h-[55vh] overflow-auto w-full py-3'),
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
  );
};

export default SendMessagebar;
