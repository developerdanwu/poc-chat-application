import React, { useState } from 'react';
import { Editable, Slate, useSlate, withReact } from 'slate-react';
import isHotkey from 'is-hotkey';
import SlateElement from './Element';
import {
  createEditor,
  type Descendant,
  type Editor,
  Element,
  type Node,
  type NodeEntry,
} from 'slate';
import { withHistory } from 'slate-history';
import { toChildren, toggleMark } from '@/components/modules/rich-text/utils';
import Leaf from '@/components/modules/rich-text/Leaf';
import {
  SetNodeToDecorations,
  toCodeLines,
} from '@/components/modules/rich-text/blocks/codeBlock';
import { type EditableProps } from 'slate-react/dist/components/editable';
import EditorMenuBar from '@/components/modules/rich-text/EditorMenuBar';

const useDecorate = (editor: Editor) => {
  return ([node]: NodeEntry<Node>) => {
    if (Element.isElement(node) && node.type === 'codeLine') {
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

export const RichTextEditable = ({
  onKeyDown,
  readOnly,
}: Pick<EditableProps, 'onKeyDown' | 'readOnly'>) => {
  const editor = useSlate();
  const decorate = useDecorate(editor);

  return (
    <Editable
      decorate={decorate}
      renderLeaf={Leaf}
      renderElement={SlateElement}
      autoFocus
      spellCheck
      readOnly={readOnly}
      placeholder="Enter some rich text…"
      className="min-h-fit w-full overflow-auto focus:outline-0"
      onKeyDown={(event) => {
        onKeyDown?.(event);
        for (const hotkey in HOTKEYS) {
          if (isHotkey(hotkey, event as any)) {
            event.preventDefault();
            const mark = HOTKEYS[hotkey as keyof typeof HOTKEYS];
            toggleMark(editor, mark);
          }
        }
      }}
    />
  );
};

export const BaseRichTextEditor = ({
  header,
  footer,
  slotProps,
}: {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  slotProps: {
    root: {
      initialValue: Descendant[];
      onChange?: ((value: Descendant[]) => void) | undefined;
    };
    editable?: Pick<EditableProps, 'onKeyDown' | 'readOnly'>;
  };
}) => {
  const [editor] = useState(() => withHistory(withReact(createEditor())));

  return (
    <Slate editor={editor} {...slotProps.root}>
      {header}
      <SetNodeToDecorations />
      <RichTextEditable {...slotProps?.editable} />
      {footer}
    </Slate>
  );
};

const RichTextEditor = ({
  initialValue,
  onChange,
  onKeyDown,
}: {
  initialValue: Descendant[];
  onChange?: (value: Descendant[]) => void;
} & Pick<EditableProps, 'onKeyDown'>) => {
  const [editor] = useState(() => withHistory(withReact(createEditor())));

  return (
    <div className="flex h-auto  min-h-fit w-full flex-col space-y-2 rounded-md border border-slate-300 p-3">
      <Slate editor={editor} initialValue={initialValue} onChange={onChange}>
        <EditorMenuBar />
        <SetNodeToDecorations />
        <RichTextEditable onKeyDown={onKeyDown} />
      </Slate>
    </div>
  );
};

export default RichTextEditor;
