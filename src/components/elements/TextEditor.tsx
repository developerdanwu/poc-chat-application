import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import cn from "clsx";
import {
  RiBold,
  RiItalic,
  RiStrikethrough,
  RiSendPlane2Fill,
} from "react-icons/ri";
import { useFormContext } from "react-hook-form";
import { useEffect } from "react";

const MenuBar = ({ editor }: { editor: Editor }) => {
  return (
    <div className={"flex space-x-2"}>
      <button
        type={"button"}
        onClick={() => editor.commands.toggleBold()}
        className={cn("btn-outline btn-square btn-xs btn border-0", {
          "btn-active": editor.isActive("bold"),
        })}
      >
        <RiBold size={"18px"} />
      </button>
      <button
        type={"button"}
        onClick={() => editor.commands.toggleItalic()}
        className={cn("btn-outline btn-square btn-xs btn border-0", {
          "btn-active": editor.isActive("italic"),
        })}
      >
        <RiItalic size={"18px"} />
      </button>
      <button
        type={"button"}
        onClick={() => editor.commands.toggleStrike()}
        className={cn("btn-outline btn-square btn-xs btn border-0", {
          "btn-active": editor.isActive("strike"),
        })}
      >
        <RiStrikethrough size={"18px"} />
      </button>
      <button></button>
    </div>
  );
};

const SendBar = () => {
  const { formState } = useFormContext();
  return (
    <div className={"flex justify-between"}>
      <div></div>
      <button
        className={cn("btn-primary btn-sm btn", {
          "btn-disabled": !formState.isValid,
        })}
      >
        <RiSendPlane2Fill />
      </button>
    </div>
  );
};

const TextEditor = ({
  onChange,
  content,
}: {
  onChange: (...event: any[]) => void;
  content: any;
}) => {
  const { setValue } = useFormContext();
  const editor = useEditor({
    extensions: [StarterKit],
    editorProps: {
      attributes: {
        class: "border-0 max-h-[100px] overflow-auto w-full py-3",
      },
    },
    content: content,
    onUpdate: ({ editor }) => {
        editor.getJSON()
      setValue("text", editor.getText());
      onChange(editor.getJSON());
    },
  });
  useEffect(() => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    editor.commands.setContent(content, false, {
      preserveWhitespace: "full",
    });
    editor.commands.setTextSelection({ from, to });
  }, [editor, content]);

  if (!editor) {
    return null;
  }
  return (
    <div
      className={cn(
        "group w-full rounded-lg border-2 border-neutral px-3 py-2",
        {
          "!border-neutral-focus": editor.isFocused,
        }
      )}
    >
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
      <SendBar />
    </div>
  );
};

export default TextEditor;
