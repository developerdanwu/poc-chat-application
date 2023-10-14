import {
  type Descendant,
  Editor,
  Element as SlateElement,
  Node,
  type Text,
  Transforms,
} from 'slate';
import { ReactEditor } from 'slate-react';

export const isMarkActive = (
  editor: Editor,
  format: keyof Omit<Text, 'text'>
) => {
  const marks = Editor.marks(editor);
  return marks ? marks[format] === true : false;
};
export const toggleMark = (
  editor: Editor,
  format: keyof Omit<Text, 'text'>
) => {
  const isActive = isMarkActive(editor, format);

  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

export const toChildren = (content: string) => [{ text: content }];

export const isBlockActive = (
  editor: Editor,
  format: SlateElement['type'],
  blockType: 'type' = 'type'
) => {
  const { selection } = editor;
  if (!selection) return false;

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: (n) =>
        !Editor.isEditor(n) &&
        SlateElement.isElement(n) &&
        n[blockType] === format,
    })
  );

  return !!match;
};

export const toggleBlock = (editor: Editor, format: SlateElement['type']) => {
  const isActive = isBlockActive(editor, format, 'type');

  switch (format) {
    case 'codeBlock': {
      if (isActive) {
        Transforms.unwrapNodes(editor, {
          match: (n) =>
            !Editor.isEditor(n) &&
            SlateElement.isElement(n) &&
            n.type === 'codeBlock',
          split: true,
        });

        Transforms.setNodes<SlateElement>(editor, {
          type: 'paragraph' as const,
        });
      } else {
        Transforms.wrapNodes(
          editor,
          { type: 'codeBlock', language: 'typescript', children: [] },
          {
            match: (n) => SlateElement.isElement(n),
            split: true,
          }
        );
        Transforms.setNodes(
          editor,
          { type: 'codeLine' },
          { match: (n) => SlateElement.isElement(n) }
        );
      }
      break;
    }
    default: {
      throw new Error(`${format} is not a toggle-able block type`);
    }
  }
};

export const slateJSONToPlainText = (nodes: Descendant[]) => {
  return nodes
    .map((n) => {
      return Node.string(n);
    })
    .join(' ')
    .replace(/[\r\n]/gm, '')
    .trim();
};

export const resetEditor = (
  editor: Editor,
  options?: { insertEmptyNode: boolean }
) => {
  Transforms.delete(editor, {
    at: {
      anchor: Editor.start(editor, []),
      focus: Editor.end(editor, []),
    },
  });

  // Removes empty node
  Transforms.removeNodes(editor, {
    at: [0],
  });
  if (options?.insertEmptyNode) {
    Transforms.insertNodes(editor, {
      type: 'paragraph',
      children: [{ text: '' }],
    });
  }

  ReactEditor.focus(editor);
};
