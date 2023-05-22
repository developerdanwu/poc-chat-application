import {
  type Editor,
  EditorContent,
  EditorOptions,
  useEditor,
} from '@tiptap/react';
import cn from 'clsx';
import {
  RiBold,
  RiCodeBoxLine,
  RiCodeLine,
  RiItalic,
  RiSendPlane2Fill,
  RiStrikethrough,
} from 'react-icons/ri';
import { useFormContext } from 'react-hook-form';
import { Paragraph } from '@tiptap/extension-paragraph';
import { useEffect } from 'react';
import {
  TiptapCodeBlockLight,
  TipTapStarterKit,
} from '@/components/modules/TextEditor/utils';

export const MenuBar = ({ editor }: { editor: Editor }) => {
  return (
    <div className="flex h-full w-full items-center space-x-2">
      <button
        type="button"
        disabled={editor.isActive('codeBlock')}
        onClick={() => editor.commands.toggleBold()}
        className={cn('btn-outline btn-square btn-xs btn grid border-0', {
          'btn-active': editor.isActive('bold'),
          'btn-disabled': editor.isActive('codeBlock'),
        })}
      >
        <RiBold size="18px" />
      </button>
      <button
        type="button"
        disabled={editor.isActive('codeBlock')}
        onClick={() => editor.commands.toggleItalic()}
        className={cn('btn-outline btn-square btn-xs btn grid border-0', {
          'btn-active': editor.isActive('italic'),
          'btn-disabled': editor.isActive('codeBlock'),
        })}
      >
        <RiItalic size="18px" />
      </button>
      <button
        type="button"
        disabled={editor.isActive('codeBlock')}
        onClick={() => editor.commands.toggleStrike()}
        className={cn('btn-outline btn-square btn-xs btn grid border-0', {
          'btn-active': editor.isActive('strike'),
          'btn-disabled': editor.isActive('codeBlock'),
        })}
      >
        <RiStrikethrough size="18px" />
      </button>
      <div className="divider divider-horizontal before:bg-neutral after:bg-neutral" />
      <button
        type="button"
        disabled={editor.isActive('codeBlock')}
        onClick={() => editor.commands.toggleCode()}
        className={cn('btn-outline btn-square btn-xs btn grid border-0', {
          'btn-active': editor.isActive('code'),
          'btn-disabled': editor.isActive('codeBlock'),
        })}
      >
        <RiCodeLine size="18px" />
      </button>

      <button
        type="button"
        onClick={() => editor.commands.toggleCodeBlock()}
        className={cn('btn-outline btn-square btn-xs btn grid border-0', {
          'btn-active': editor.isActive('codeBlock'),
        })}
      >
        <RiCodeBoxLine size="18px" />
      </button>
    </div>
  );
};

const SendBar = () => {
  const { formState } = useFormContext();
  return (
    <div className="flex justify-between">
      <div></div>
      <button
        disabled={!formState.isValid}
        className={cn('btn-primary btn-sm btn', {
          'btn-disabled': !formState.isValid,
        })}
      >
        <RiSendPlane2Fill />
      </button>
    </div>
  );
};

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

const TextEditor = ({
  componentProps,
  onChange,
  content,
}: {
  componentProps?: {
    editor: {
      extensions?: EditorOptions['extensions'];
    };
  };
  onChange: (...event: any[]) => void;
  content: any;
}) => {
  const chatForm = useFormContext();

  const editor = useEditor({
    extensions: [
      ...(componentProps?.editor.extensions
        ? componentProps?.editor.extensions
        : []),
      TipTapStarterKit,
      Paragraph,
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
      chatForm.setValue('text', editor.getText());
      onChange(editor.getJSON());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    editor.commands.setContent(content, false, {
      preserveWhitespace: 'full',
    });
    editor.commands.setTextSelection({ from, to });
  }, [editor, content]);

  if (!editor) {
    return null;
  }
  return (
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
      <SendBar />
    </div>
  );
};

export default TextEditor;
