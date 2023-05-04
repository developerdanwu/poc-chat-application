import { type Editor, EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import cn from "clsx";
import {
  RiBold,
  RiItalic,
  RiSendPlane2Fill,
  RiStrikethrough,
} from "react-icons/ri";
import { useFormContext } from "react-hook-form";
import { useEffect } from "react";
import { Paragraph } from "@tiptap/extension-paragraph";
import { api } from "@/utils/api";
import { getQueryKey } from "@trpc/react-query";
import { useRouter } from "next/router";
import { useQueryClient } from "@tanstack/react-query";

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
  const { formState, handleSubmit } = useFormContext();
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

const CustomParagraph = () => {
  const chatForm = useFormContext<{
    text: string;
    content: any;
  }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const chatroomId =
    typeof router.query.chatroomId === "string" ? router.query.chatroomId : "";
  const sendMessageToAi = api.messaging.sendMessageToAi.useMutation({
    onSettled: () => {
      queryClient.invalidateQueries(
        getQueryKey(api.messaging.getMessages, {
          chatroomId,
        })
      );
    },
    onMutate: () => {
      console.log("MUTATE");
      chatForm.reset();
    },
  });

  return Paragraph.extend({
    addKeyboardShortcuts() {
      return {
        Enter: () =>
          this.editor.commands.command(() => {
            chatForm.handleSubmit((data) => {
              sendMessageToAi.mutate({
                ...data,
                chatroomId,
              });
            })();
            return true;
          }),
      };
    },
  });
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
    extensions: [StarterKit, CustomParagraph()],
    editorProps: {
      attributes: {
        form: "chatForm",
        class: "border-0 max-h-[100px] overflow-auto w-full py-3",
      },
    },
    content: <p>{content}</p>,
    onUpdate: ({ editor }) => {
      editor.getJSON();
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