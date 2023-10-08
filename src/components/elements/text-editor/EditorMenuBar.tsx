import {
  RiBold,
  RiCodeBoxLine,
  RiCodeLine,
  RiItalic,
  RiStrikethrough,
} from 'react-icons/ri';
import { IconButton } from '@/components/elements/IconButton';
import { Separator } from '@/components/elements/separator';
import { useSlate } from 'slate-react';

const EditorMenuBar = () => {
  const editor = useSlate();
  return (
    <div className="flex h-5 w-full items-center space-x-2">
      <IconButton
        type="button"
        size="sm"
        variant="ghost"
        state={editor.isActive('bold') ? 'active' : 'default'}
        disabled={editor.isActive('codeBlock')}
        onClick={() => editor.commands.toggleBold()}
      >
        <RiBold size="18px" />
      </IconButton>
      <IconButton
        size="sm"
        type="button"
        variant="ghost"
        state={editor.isActive('italic') ? 'active' : 'default'}
        disabled={editor.isActive('codeBlock')}
        onClick={() => editor.commands.toggleItalic()}
      >
        <RiItalic size="18px" />
      </IconButton>
      <IconButton
        size="sm"
        type="button"
        variant="ghost"
        state={editor.isActive('strike') ? 'active' : 'default'}
        disabled={editor.isActive('codeBlock')}
        onClick={() => editor.commands.toggleStrike()}
      >
        <RiStrikethrough size="18px" />
      </IconButton>
      <Separator orientation="vertical" />
      <IconButton
        size="sm"
        type="button"
        variant="ghost"
        state={editor.isActive('code') ? 'active' : 'default'}
        disabled={editor.isActive('codeBlock')}
        onClick={() => editor.commands.toggleCode()}
      >
        <RiCodeLine size="18px" />
      </IconButton>

      <IconButton
        size="sm"
        type="button"
        variant="ghost"
        state={editor.isActive('codeBlock') ? 'active' : 'default'}
        onClick={() => editor.commands.toggleCodeBlock()}
      >
        <RiCodeBoxLine size="18px" />
      </IconButton>
    </div>
  );
};

export default EditorMenuBar;
