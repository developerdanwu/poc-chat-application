import { useSlate } from 'slate-react';
import {
  isBlockActive,
  isMarkActive,
  toggleBlock,
  toggleMark,
} from '@/components/modules/rich-text/utils';
import { IconButton } from '@/components/elements/IconButton';
import {
  RiBold,
  RiCodeBoxLine,
  RiCodeLine,
  RiItalic,
  RiStrikethrough,
} from 'react-icons/ri';
import React from 'react';
import { Separator } from '@/components/elements/separator';

const CodeBlockButton = () => {
  const editor = useSlate();
  const isCodeBlockActive = isBlockActive(editor, 'codeBlock');
  return (
    <IconButton
      size="sm"
      type="button"
      variant="ghost"
      state={isCodeBlockActive ? 'active' : 'default'}
      onClick={(e) => {
        e.preventDefault();
        toggleBlock(editor, 'codeBlock');
      }}
    >
      <RiCodeBoxLine size="18px" />
    </IconButton>
  );
};
const EditorMenuBar = () => {
  const editor = useSlate();

  const isCodeBlockActive = isBlockActive(editor, 'codeBlock');

  return (
    <div className="flex h-5 w-full items-center space-x-2">
      <IconButton
        type="button"
        size="sm"
        variant="ghost"
        state={isMarkActive(editor, 'bold') ? 'active' : 'default'}
        disabled={isCodeBlockActive}
        onMouseDown={(e) => {
          e.preventDefault();
          toggleMark(editor, 'bold');
        }}
      >
        <RiBold size="18px" />
      </IconButton>
      <IconButton
        size="sm"
        type="button"
        variant="ghost"
        state={isMarkActive(editor, 'italic') ? 'active' : 'default'}
        disabled={isCodeBlockActive}
        onMouseDown={(e) => {
          e.preventDefault();
          toggleMark(editor, 'italic');
        }}
      >
        <RiItalic size="18px" />
      </IconButton>
      <IconButton
        size="sm"
        type="button"
        variant="ghost"
        state={isMarkActive(editor, 'strike') ? 'active' : 'default'}
        disabled={isCodeBlockActive}
        onMouseDown={(e) => {
          e.preventDefault();
          toggleMark(editor, 'strike');
        }}
      >
        <RiStrikethrough size="18px" />
      </IconButton>
      <Separator orientation="vertical" />
      <IconButton
        size="sm"
        type="button"
        variant="ghost"
        state={isMarkActive(editor, 'code') ? 'active' : 'default'}
        disabled={isCodeBlockActive}
        onMouseDown={(e) => {
          e.preventDefault();
          toggleMark(editor, 'code');
        }}
      >
        <RiCodeLine size="18px" />
      </IconButton>
      <CodeBlockButton />
    </div>
  );
};

export default EditorMenuBar;
