import { type Editor, type EditorOptions, useEditor } from '@tiptap/react';
import {
  TiptapCodeBlockLight,
  TipTapStarterKit,
} from '@/components/elements/text-editor/extensions';

export type TiptapEditorWrapperProps = {
  children: (editor: Editor) => JSX.Element;
} & Partial<EditorOptions> & {
    editorProps?: EditorOptions['editorProps'] & {
      attributes?: any;
    };
  };

const TiptapEditorWrapper = ({
  extensions,
  children,
  editorProps,
  ...restProps
}: TiptapEditorWrapperProps) => {
  const editor = useEditor({
    extensions: [
      ...(extensions ? extensions : []),
      TipTapStarterKit,
      TiptapCodeBlockLight,
    ],
    editorProps: {
      ...(editorProps ? editorProps : {}),
      attributes: {
        ...(editorProps?.attributes ? editorProps?.attributes : {}),
      },
    },
    ...(restProps ? restProps : {}),
  });

  if (!editor) {
    return null;
  }

  return children(editor);
};

export default TiptapEditorWrapper;
