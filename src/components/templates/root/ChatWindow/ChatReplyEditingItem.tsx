import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { cn } from '@/utils/utils';
import { EditorContent, useEditor } from '@tiptap/react';
import {
  TiptapCodeBlockLight,
  TipTapStarterKit,
} from '@/components/modules/TextEditor/utils';
import { Paragraph } from '@tiptap/extension-paragraph';
import { MenuBar } from '@/components/modules/TextEditor/TextEditor';
import { safeGenerateMessageContent } from '@/components/templates/root/ChatWindow/ChatWindow';
import { api } from '@/utils/api';
import produce from 'immer';
import { InfiniteData } from '@tanstack/react-query';
import { RouterOutput } from '@/server/api/root';

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
              }
            });
          });
        });

        return {
          pages: newState,
          pageParams: old.pageParams,
        };
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

  const editor = useEditor({
    extensions: [
      TipTapStarterKit,
      TextEditorParagraph({
        onClickEnter: () => {},
      }),
      TiptapCodeBlockLight,
    ],
    content:
      safeGenerateMessageContent(
        JSON.parse(editChatForm.getValues('content'))
      ) || text,
    editorProps: {
      attributes: {
        form: 'chatForm',
        class: 'border-0 max-h-[55vh] overflow-auto w-full py-3',
      },
    },
    onUpdate: ({ editor }) => {
      editChatForm.setValue('text', editor.getText());
      editChatForm.setValue('content', JSON.stringify(editor.getJSON()));
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <FormProvider {...editChatForm}>
      <form
        onSubmit={editChatForm.handleSubmit((data) => {
          editMessage.mutate({
            clientMessageId,
            text: data.text,
            content: data.content,
          });
          setIsEditing(undefined);
        })}
        className={cn(
          'group w-full rounded-lg border-2 border-warm-gray-400 bg-warm-gray-50 px-3 py-2',
          {
            '!border-warm-gray-600': editor.isFocused,
          }
        )}
      >
        <MenuBar editor={editor} />
        <EditorContent editor={editor} />
        <div className="flex justify-between">
          <div></div>
          <div className={'flex space-x-2'}>
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
              // disabled={!formState.isValid}
              className={cn('btn-primary btn-sm btn', {
                // 'btn-disabled': !formState.isValid,
              })}
            >
              save
            </button>
          </div>
        </div>
      </form>
    </FormProvider>
  );
};

export default ChatReplyEditingItem;
