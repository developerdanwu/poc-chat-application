import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import cn from "clsx";
import { RiBold, RiItalic, RiStrikethrough } from "react-icons/ri";

const MenuBar = ({ editor }: { editor: Editor }) => {
  return (
    <div className={"flex space-x-2"}>
      <button
        onClick={() => editor.commands.toggleBold()}
        className={"btn-outline btn-square btn-xs btn border-0"}
      >
        <RiBold size={"18px"} />
      </button>
      <button className={"btn-outline btn-square btn-xs btn border-0"}>
        <RiItalic size={"18px"} />
      </button>
      <button className={"btn-outline btn-square btn-xs btn border-0"}>
        <RiStrikethrough size={"18px"} />
      </button>
    </div>
  );
};

const TextEditor = () => {
  const editor = useEditor({
    extensions: [StarterKit],
    editorProps: {
      attributes: {
        class: "border-0 max-h-[100px] overflow-auto w-full py-4",
      },
    },
    content: "<p>Hello World!</p>",
  });

  return (
    <div
      className={cn(
        "group w-full rounded-lg border-2 border-neutral px-3 py-2",
        {
          "!border-neutral-focus": editor?.isFocused,
        }
      )}
    >
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};

export default TextEditor;
