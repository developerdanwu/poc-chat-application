import { Editor, type Text } from 'slate';

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
