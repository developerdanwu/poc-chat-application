import React, { useState } from 'react';
import { Editable, Slate, useSlate, withReact } from 'slate-react';
import isHotkey from 'is-hotkey';
import SlateElement from './Element';
import {
  createEditor,
  type Editor,
  Element,
  type Node,
  type NodeEntry,
  Transforms,
} from 'slate';
import { IconButton } from '@/components/elements/IconButton';
import { withHistory } from 'slate-history';

import {
  RiBold,
  RiCodeBoxLine,
  RiCodeLine,
  RiItalic,
  RiStrikethrough,
} from 'react-icons/ri';
import {
  isBlockActive,
  isMarkActive,
  toChildren,
  toggleMark,
} from '@/pages/[chatroomId]/_components/main/RichTextEditor/utils';
import { Separator } from '@/components/elements/separator';
import Leaf from '@/pages/[chatroomId]/_components/main/RichTextEditor/Leaf';
import {
  SetNodeToDecorations,
  toCodeLines,
} from '@/pages/[chatroomId]/_components/main/RichTextEditor/functions/codeBlock';

const useDecorate = (editor: Editor) => {
  return ([node]: NodeEntry<Node>) => {
    if (Element.isElement(node) && node.type === 'codeLine') {
      console.log('RANGES', editor.nodeToDecorations.get(node));
      const ranges = editor.nodeToDecorations.get(node) || [];
      return ranges;
    }

    return [];
  };
};

const HOTKEYS = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+u': 'underline',
  'mod+`': 'code',
} as const;
const initialValue: Element[] = [
  {
    type: 'paragraph',
    children: toChildren(
      "Here's one containing a single paragraph block with some text in it:"
    ),
  },
  {
    type: 'codeBlock',
    language: 'jsx',
    children: toCodeLines(`// Add the initial value.
const initialValue = [
  {
    type: 'paragraph',
    children: [{ text: 'A line of text in a paragraph.' }]
  }
]

const App = () => {
  const [editor] = useState(() => withReact(createEditor()))

  return (
    <Slate editor={editor} initialValue={initialValue}>
      <Editable />
    </Slate>
  )
}`),
  },
  {
    type: 'paragraph',
    children: toChildren(
      'If you are using TypeScript, you will also need to extend the Editor with ReactEditor and add annotations as per the documentation on TypeScript. The example below also includes the custom types required for the rest of this example.'
    ),
  },
  {
    type: 'codeBlock',
    language: 'typescript',
    children: toCodeLines(`// TypeScript users only add this code
import { BaseEditor, Descendant } from 'slate'
import { ReactEditor } from 'slate-react'

type CustomElement = { type: 'paragraph'; children: CustomText[] }
type CustomText = { text: string }

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor
    Element: CustomElement
    Text: CustomText
  }
}`),
  },
  {
    type: 'paragraph',
    children: toChildren('There you have it!'),
  },
];
const CodeBlockButton = () => {
  const editor = useSlate();
  const isCodeBlockActive = isBlockActive(editor, 'codeBlock');
  return (
    <IconButton
      size="sm"
      type="button"
      variant="ghost"
      state={isCodeBlockActive ? 'active' : 'default'}
      onClick={() => {
        Transforms.unwrapNodes(editor);
        Transforms.wrapNodes(
          editor,
          { type: 'codeBlock', language: 'html', children: [] },
          {
            match: (n) => Element.isElement(n) && n.type === 'paragraph',
            split: true,
          }
        );
        Transforms.setNodes(
          editor,
          { type: 'codeLine' },
          { match: (n) => Element.isElement(n) && n.type === 'paragraph' }
        );
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
        onClick={() => toggleMark(editor, 'bold')}
      >
        <RiBold size="18px" />
      </IconButton>
      <IconButton
        size="sm"
        type="button"
        variant="ghost"
        state={isMarkActive(editor, 'italic') ? 'active' : 'default'}
        disabled={isCodeBlockActive}
        onClick={() => toggleMark(editor, 'italic')}
      >
        <RiItalic size="18px" />
      </IconButton>
      <IconButton
        size="sm"
        type="button"
        variant="ghost"
        state={isMarkActive(editor, 'strike') ? 'active' : 'default'}
        disabled={isCodeBlockActive}
        onClick={() => toggleMark(editor, 'strike')}
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
        onClick={() => toggleMark(editor, 'code')}
      >
        <RiCodeLine size="18px" />
      </IconButton>
      <CodeBlockButton />
    </div>
  );
};

const RichTextEditor = () => {
  const [editor] = useState(() => withHistory(withReact(createEditor())));
  const decorate = useDecorate(editor);

  return (
    <div className="h-auto w-full space-y-2 overflow-hidden rounded-md border border-slate-300 p-3">
      <Slate editor={editor} initialValue={initialValue}>
        <EditorMenuBar />
        <SetNodeToDecorations />
        <Editable
          decorate={decorate}
          renderLeaf={Leaf}
          renderElement={SlateElement}
          autoFocus
          spellCheck
          placeholder="Enter some rich text…"
          className="h-full max-h-[500px] w-full overflow-auto focus:outline-0"
          onKeyDown={(event) => {
            for (const hotkey in HOTKEYS) {
              if (isHotkey(hotkey, event as any)) {
                event.preventDefault();
                const mark = HOTKEYS[hotkey as keyof typeof HOTKEYS];
                toggleMark(editor, mark);
              }
            }
          }}
        />
      </Slate>
    </div>
  );
};

export default RichTextEditor;
