import React from 'react';
import { Editor, EditorOptions, useEditor } from '@tiptap/react';
import {
  TiptapCodeBlockLight,
  TipTapStarterKit,
} from '@/components/modules/TextEditor/utils';
import { Paragraph } from '@tiptap/extension-paragraph';
import { EditorProps } from '@tiptap/pm/view';
import { cn } from '@/lib/utils';

const test: EditorProps<any> = {
  attributes: {
    class: 'hello',
  },
};

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
      Paragraph,
      TiptapCodeBlockLight,
    ],
    editorProps: {
      ...(editorProps ? editorProps : {}),
      attributes: {
        ...(editorProps?.attributes ? editorProps?.attributes : {}),
        class: cn(
          'border-0 max-h-[55vh] overflow-auto w-full py-3',
          editorProps?.attributes?.class
        ),
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
