import React, { useRef } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { EditorContent } from '@tiptap/react';
import { Paragraph } from '@tiptap/extension-paragraph';
import { api } from '@/lib/api';
import produce from 'immer';
import { type InfiniteData } from '@tanstack/react-query';
import { type RouterOutput } from '@/server/api/root';
import EditorMenuBar from '@/components/modules/TextEditor/EditorMenuBar';
import HookFormTiptapEditor from '@/components/modules/TextEditor/HookFormTiptapEditor';

const TextEditorParagraph = ({
  onClickEnter,
}: {
  onClickEnter: () => void;
}) => {
  return Paragraph.extend({
    addKeyboardShortcuts() {
      return {
        'Shift-Enter': () => {
          return this.editor.commands.newlineInCode();
        },
        // override enter command to submit form
        Enter: () =>
          this.editor.commands.command(() => {
            onClickEnter();
            return true;
          }),
      };
    },
  });
};

const ChatReplyEditingItem = ({
  text,
  content,
  setIsEditing,
  clientMessageId,
  chatroomId,
}: {
  chatroomId: string;
  clientMessageId: number;
  text: string;
  setIsEditing: React.Dispatch<React.SetStateAction<number | undefined>>;
  content: string;
}) => {
  const trpcUtils = api.useContext();
  const editChatForm = useForm({
    defaultValues: {
      text,
      content,
    },
  });

  const formRef = useRef<HTMLFormElement>(null);

  const editMessage = api.messaging.editMessage.useMutation({
    onMutate: (data) => {
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

        const newState = produce(old.pages, (draft) => {
          draft.forEach((item) => {
            item.messages.forEach((message) => {
              if (message.client_message_id === data.clientMessageId) {
                message.text = data.text;
                message.content = data.content;
                message.is_edited = true;
              }
            });
          });
        });

        return {
          pages: newState,
          pageParams: old.pageParams,
        };
      });

      setIsEditing(undefined);

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
    <FormProvider {...editChatForm}>
      <form
        className="w-full"
        ref={formRef}
        onSubmit={editChatForm.handleSubmit((data) => {
          editMessage.mutate({
            clientMessageId,
            text: data.text,
            content: data.content,
          });
        })}
      >
        <HookFormTiptapEditor fieldName="content">
          {(editor) => {
            return (
              <div
                className={cn(
                  'group w-full rounded-lg border-2 border-warm-gray-400 bg-warm-gray-50 px-3 py-2',
                  {
                    '!border-warm-gray-600': editor.isFocused,
                  }
                )}
              >
                <EditorMenuBar editor={editor} />
                <EditorContent editor={editor} />
                <div className="flex justify-between">
                  <div></div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setIsEditing(undefined);
                      }}
                      // disabled={!formState.isValid}
                      className={cn('btn-outline btn-sm btn', {
                        // 'btn-disabled': !formState.isValid,
                      })}
                    >
                      cancel
                    </button>
                    <button
                      type="submit"
                      // disabled={!formState.isValid}
                      className={cn('btn-primary btn-sm btn', {
                        // 'btn-disabled': !formState.isValid,
                      })}
                    >
                      save
                    </button>
                  </div>
                </div>
              </div>
            );
          }}
        </HookFormTiptapEditor>
      </form>
    </FormProvider>
  );
};

export default ChatReplyEditingItem;
