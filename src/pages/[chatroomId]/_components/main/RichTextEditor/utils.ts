import { Editor } from 'slate';

type MarkFormats =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'codeBlock'
  | 'code'
  | 'strike';

export const isMarkActive = (editor: Editor, format: MarkFormats) => {
  const marks = Editor.marks(editor);
  return marks ? marks[format] === true : false;
};
export const toggleMark = (editor: Editor, format: MarkFormats) => {
  const isActive = isMarkActive(editor, format);

  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};
