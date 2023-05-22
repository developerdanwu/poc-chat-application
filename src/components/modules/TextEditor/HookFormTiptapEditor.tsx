import React, { useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import TiptapEditorWrapper, {
  TiptapEditorWrapperProps,
} from '@/components/modules/TextEditor/TiptapEditorWrapper';
import { safeJSONParse } from '@/lib/utils';

const TiptapEditorContent = ({
  editor,
  content,
  children,
}: {
  children: JSX.Element;
  editor: Editor;
  content: string;
}) => {
  useEffect(() => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    editor.commands.setContent(content, false, {
      preserveWhitespace: 'full',
    });
    editor.commands.setTextSelection({ from, to });
  }, [editor, content]);

  return children;
};

const HookFormTiptapEditor = ({
  fieldName,
  children,
  ...restProps
}: {
  fieldName: string;
} & TiptapEditorWrapperProps) => {
  const { control, setValue, getValues } = useFormContext();
  const text = useWatch({
    name: 'text',
    control,
  });
  return (
    <Controller
      control={control}
      render={({ field: { value, onChange } }) => {
        return (
          <TiptapEditorWrapper
            {...restProps}
            content={safeJSONParse(value) || text}
            onUpdate={({ editor, ...restUpdateProps }) => {
              setValue('text', editor.getText());
              onChange(JSON.stringify(editor.getJSON()));
              restProps.onUpdate?.({ editor, ...restUpdateProps });
            }}
          >
            {(editor) => {
              return (
                <TiptapEditorContent
                  editor={editor}
                  content={safeJSONParse(value) || text}
                >
                  {children(editor)}
                </TiptapEditorContent>
              );
            }}
          </TiptapEditorWrapper>
        );
      }}
      name={fieldName}
    />
  );
};

export default HookFormTiptapEditor;
