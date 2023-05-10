import React from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { Paragraph } from "@tiptap/extension-paragraph";
import {
  TiptapCodeBlockLight,
  TipTapStarterKit,
} from "@/components/modules/TextEditor/utils";

const ChatContent = ({ content }: { content: any }) => {
  const editor = useEditor({
    extensions: [TipTapStarterKit, Paragraph, TiptapCodeBlockLight],
    editable: false,
    content,
  });

  return <EditorContent editor={editor} />;
};

export default ChatContent;
