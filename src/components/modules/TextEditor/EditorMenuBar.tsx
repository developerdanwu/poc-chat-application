import { Editor } from '@tiptap/react';
import cn from 'clsx';
import {
  RiBold,
  RiCodeBoxLine,
  RiCodeLine,
  RiItalic,
  RiStrikethrough,
} from 'react-icons/ri';

const EditorMenuBar = ({ editor }: { editor: Editor }) => {
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

export default EditorMenuBar;
