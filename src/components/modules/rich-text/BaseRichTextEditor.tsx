import React, { useState } from 'react';
import { Editable, Slate, useSlate, withReact } from 'slate-react';
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
import Leaf from '@/components/modules/rich-text/Leaf';
import { SetNodeToDecorations } from '@/components/modules/rich-text/blocks/codeBlock';
import { type EditableProps } from 'slate-react/dist/components/editable';

const useDecorate = (editor: Editor) => {
  return ([node]: NodeEntry<Node>) => {
    if (Element.isElement(node) && node.type === 'codeLine') {
      const ranges = editor.nodeToDecorations.get(node) || [];
      return ranges;
    }

    return [];
  };
};

export const RichTextEditable = ({
  onKeyDown,
  readOnly,
  placeholder,
}: Pick<EditableProps, 'readOnly' | 'placeholder'> & {
  onKeyDown?: (
    event: React.KeyboardEvent<HTMLDivElement>,
    editor: Editor
  ) => void;
}) => {
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
      placeholder={placeholder}
      className="min-h-fit w-full overflow-auto focus:outline-0"
      onKeyDown={(event) => {
        onKeyDown?.(event, editor);
      }}
    />
  );
};

const BaseRichTextEditor = ({
  header,
  footer,
  slotProps,
  editor: editorProp,
}: {
  editor?: Editor;
  editorHOC?: (editor: Editor) => Editor;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  slotProps: {
    root: {
      initialValue: Descendant[];
      onChange?: ((value: Descendant[], editor: Editor) => void) | undefined;
    };
    editable?: Pick<EditableProps, 'readOnly' | 'placeholder'> & {
      onKeyDown?: (
        event: React.KeyboardEvent<HTMLDivElement>,
        editor: Editor
      ) => void;
    };
  };
}) => {
  const [editor] = useState(() => withHistory(withReact(createEditor())));
  const resultEditor = editorProp ? editorProp : editor;

  return (
    <Slate
      editor={resultEditor}
      initialValue={slotProps.root.initialValue}
      onChange={(value) => {
        slotProps.root?.onChange?.(value, editor);
      }}
    >
      {header}
      <SetNodeToDecorations />
      <RichTextEditable {...slotProps?.editable} />
      {footer}
    </Slate>
  );
};

export default BaseRichTextEditor;
