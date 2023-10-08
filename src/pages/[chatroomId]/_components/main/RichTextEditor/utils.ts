import { Editor, Node, type Text } from 'slate';

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

export function getCommonBlock(editor: Editor) {
  if (!editor.selection) {
    return;
  }

  const range = Editor.unhangRange(editor, editor.selection, { voids: true });

  const [common, path] = Node.common(
    editor,
    range.anchor.path,
    range.focus.path
  );

  if (Editor.isBlock(editor, common) || Editor.isEditor(common)) {
    return [common, path];
  } else {
    return Editor.above(editor, {
      at: path,
      match: (n) => Editor.isBlock(editor, n) || Editor.isEditor(n),
    });
  }
}
