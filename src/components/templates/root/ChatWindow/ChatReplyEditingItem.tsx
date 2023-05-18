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
  content,
  setIsEditing,
}: {
  setIsEditing: React.Dispatch<React.SetStateAction<number | undefined>>;
  content: string;
}) => {
  const editChatForm = useForm();

  const editor = useEditor({
    extensions: [
      TipTapStarterKit,
      TextEditorParagraph({
        onClickEnter: () => {},
      }),
      TiptapCodeBlockLight,
    ],
    content,
    editorProps: {
      attributes: {
        form: 'chatForm',
        class: 'border-0 max-h-[55vh] overflow-auto w-full py-3',
      },
    },
    onUpdate: ({ editor }) => {
      editChatForm.setValue('text', editor.getText());
      // onChange(editor.getJSON());
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <FormProvider {...editChatForm}>
      <div
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
      </div>
    </FormProvider>
  );
};

export default ChatReplyEditingItem;
