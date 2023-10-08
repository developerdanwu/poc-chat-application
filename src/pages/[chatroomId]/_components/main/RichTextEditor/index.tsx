import React, { useState } from 'react';
import {
  Editable,
  Slate,
  useSlate,
  useSlateStatic,
  withReact,
} from 'slate-react';
import isHotkey from 'is-hotkey';
import SlateElement from './Element';
import {
  createEditor,
  Editor,
  Element,
  Node,
  type NodeEntry,
  type Range,
  Transforms,
} from 'slate';
import { IconButton } from '@/components/elements/IconButton';
import { withHistory } from 'slate-history';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-java';
import {
  RiBold,
  RiCodeBoxLine,
  RiCodeLine,
  RiItalic,
  RiStrikethrough,
} from 'react-icons/ri';
import {
  isMarkActive,
  normalizeTokens,
  toggleMark,
} from '@/pages/[chatroomId]/_components/main/RichTextEditor/utils';
import { Separator } from '@/components/elements/separator';
import Leaf from '@/pages/[chatroomId]/_components/main/RichTextEditor/Leaf';
import { type CodeBlockElement } from '@/pages/[chatroomId]/_components/main/RichTextEditor/types';

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

const mergeMaps = <K, V>(...maps: Map<K, V>[]) => {
  const map = new Map<K, V>();

  for (const m of maps) {
    for (const item of m) {
      map.set(...item);
    }
  }

  return map;
};

const getChildNodeToDecorations = ([
  block,
  blockPath,
]: NodeEntry<CodeBlockElement>) => {
  const nodeToDecorations = new Map<Element, Range[]>();

  const text = block.children.map((line) => Node.string(line)).join('\n');
  const language = block.language;
  const grammer = Prism.languages[language];

  if (!grammer) {
    throw new Error(`language ${language} is not a supported Prism language`);
  }

  const tokens = Prism.tokenize(text, grammer);
  const normalizedTokens = normalizeTokens(tokens); // make tokens flat and grouped by line
  const blockChildren = block.children as Element[];
  for (let index = 0; index < normalizedTokens.length; index++) {
    const tokens = normalizedTokens[index];
    const element = blockChildren[index];

    console.log('token', tokens, 'element', element);
    if (!element) {
      throw new Error(`element: ${element} cannot be undefined`);
    }

    if (!tokens) {
      throw new Error(`tokens: ${tokens} cannot be undefined`);
    }

    if (!nodeToDecorations.has(element)) {
      nodeToDecorations.set(element, []);
    }

    let start = 0;
    for (const token of tokens) {
      const length = token.content.length;
      if (!length) {
        continue;
      }

      const end = start + length;

      const path = [...blockPath, index, 0];
      const range: Range = {
        anchor: { path, offset: start },
        focus: { path, offset: end },
        token: true,
        ...Object.fromEntries(token.types.map((type) => [type, true])),
      };

      nodeToDecorations.get(element)!.push(range);

      start = end;
    }
  }

  return nodeToDecorations;
};

// precalculate editor.nodeToDecorations map to use it inside decorate function then
const SetNodeToDecorations = () => {
  const editor = useSlate();

  const blockEntries: NodeEntry<CodeBlockElement>[] = Array.from(
    Editor.nodes(editor, {
      at: [],
      mode: 'highest',
      match: (n) => Element.isElement(n) && n.type === 'codeBlock',
    })
  );

  const nodeToDecorations = mergeMaps(
    ...blockEntries.map(getChildNodeToDecorations)
  );

  editor.nodeToDecorations = nodeToDecorations;

  return null;
};

const toChildren = (content: string) => [{ text: content }];
const toCodeLines = (content: string): Element[] =>
  content
    .split('\n')
    .map((line) => ({ type: 'codeLine', children: toChildren(line) }));

const HOTKEYS = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+u': 'underline',
  'mod+`': 'code',
} as const;

const initialValue: Element[] = [
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
];

const CodeBlockButton = () => {
  const editor = useSlateStatic();
  return (
    <IconButton
      size="sm"
      type="button"
      variant="ghost"
      // state={isMarkActive(editor, 'codeBlock') ? 'active' : 'default'}
      onClick={() => {
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
  const editor = useSlateStatic();

  return (
    <div className="flex h-5 w-full items-center space-x-2">
      <IconButton
        type="button"
        size="sm"
        variant="ghost"
        state={isMarkActive(editor, 'bold') ? 'active' : 'default'}
        disabled={isMarkActive(editor, 'codeBlock')}
        onClick={() => toggleMark(editor, 'bold')}
      >
        <RiBold size="18px" />
      </IconButton>
      <IconButton
        size="sm"
        type="button"
        variant="ghost"
        state={isMarkActive(editor, 'italic') ? 'active' : 'default'}
        disabled={isMarkActive(editor, 'codeBlock')}
        onClick={() => toggleMark(editor, 'italic')}
      >
        <RiItalic size="18px" />
      </IconButton>
      <IconButton
        size="sm"
        type="button"
        variant="ghost"
        state={isMarkActive(editor, 'strike') ? 'active' : 'default'}
        disabled={isMarkActive(editor, 'codeBlock')}
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
        disabled={isMarkActive(editor, 'codeBlock')}
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
    <div className="h-[500px] w-full space-y-2 overflow-scroll rounded-md border border-slate-300 p-3">
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
          style={{
            width: '100%',
          }}
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
