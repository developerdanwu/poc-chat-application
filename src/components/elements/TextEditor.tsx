import { type Editor, EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import cn from "clsx";
import {
  RiBold,
  RiCodeBoxLine,
  RiCodeLine,
  RiItalic,
  RiSendPlane2Fill,
  RiStrikethrough,
} from "react-icons/ri";
import { useFormContext } from "react-hook-form";
import { Paragraph } from "@tiptap/extension-paragraph";
import { api } from "@/utils/api";
import { getQueryKey } from "@trpc/react-query";
import { useRouter } from "next/router";
import { useQueryClient } from "@tanstack/react-query";
import produce from "immer";
import dayjs from "dayjs";
import { useUser } from "@clerk/nextjs";
import { v4 as uuid } from "uuid";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { lowlight } from "lowlight";
import { useEffect } from "react";

const MenuBar = ({ editor }: { editor: Editor }) => {
  return (
    <div className={"flex h-full w-full items-center space-x-2"}>
      <button
        type={"button"}
        disabled={editor.isActive("codeBlock")}
        onClick={() => editor.commands.toggleBold()}
        className={cn("btn-outline btn-square btn-xs btn grid border-0", {
          "btn-active": editor.isActive("bold"),
          "btn-disabled": editor.isActive("codeBlock"),
        })}
      >
        <RiBold size={"18px"} />
      </button>
      <button
        type={"button"}
        disabled={editor.isActive("codeBlock")}
        onClick={() => editor.commands.toggleItalic()}
        className={cn("btn-outline btn-square btn-xs btn grid border-0", {
          "btn-active": editor.isActive("italic"),
          "btn-disabled": editor.isActive("codeBlock"),
        })}
      >
        <RiItalic size={"18px"} />
      </button>
      <button
        type={"button"}
        disabled={editor.isActive("codeBlock")}
        onClick={() => editor.commands.toggleStrike()}
        className={cn("btn-outline btn-square btn-xs btn grid border-0", {
          "btn-active": editor.isActive("strike"),
          "btn-disabled": editor.isActive("codeBlock"),
        })}
      >
        <RiStrikethrough size={"18px"} />
      </button>
      <div
        className={
          "divider divider-horizontal before:bg-neutral after:bg-neutral"
        }
      />
      <button
        type={"button"}
        disabled={editor.isActive("codeBlock")}
        onClick={() => editor.commands.toggleCode()}
        className={cn("btn-outline btn-square btn-xs btn grid border-0", {
          "btn-active": editor.isActive("code"),
          "btn-disabled": editor.isActive("codeBlock"),
        })}
      >
        <RiCodeLine size={"18px"} />
      </button>

      <button
        type={"button"}
        onClick={() => editor.commands.toggleCodeBlock()}
        className={cn("btn-outline btn-square btn-xs btn grid border-0", {
          "btn-active": editor.isActive("codeBlock"),
        })}
      >
        <RiCodeBoxLine size={"18px"} />
      </button>
    </div>
  );
};

const SendBar = () => {
  const { formState } = useFormContext();
  return (
    <div className={"flex justify-between"}>
      <div></div>
      <button
        disabled={!formState.isValid}
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
  const trpcUtils = api.useContext();
  const queryClient = useQueryClient();
  const user = useUser();
  const chatroomId =
    typeof router.query.chatroomId === "string" ? router.query.chatroomId : "";
  const sendMessage = api.messaging.sendMessage.useMutation({
    onSettled: () => {
      queryClient.invalidateQueries(
        getQueryKey(
          api.messaging.getMessages,
          {
            chatroomId,
          },
          "query"
        )
      );
    },
    onMutate: (variables) => {
      trpcUtils.messaging.getMessages.setInfiniteData({ chatroomId }, (old) => {
        if (!old) {
          return {
            pages: [],
            pageParams: [],
          };
        }

        const newMessage = {
          clientMessageId: uuid(),
          text: variables.text,
          content: variables.content,
          createdAt: dayjs().toDate(),
          updatedAt: dayjs().toDate(),
          author: {
            authorId: 999,
            userId: user?.user?.id || null,
            role: "user",
            createdAt: dayjs().toDate(),
            updatedAt: dayjs().toDate(),
            firstName: user?.user?.firstName || "",
            lastName: user?.user?.lastName || "",
          },
        };

        if (old.pages.length === 0) {
          return {
            pages: [
              {
                messages: [newMessage],
                nextCursor: undefined,
              },
            ],
            pageParams: [],
          };
        }

        const newState = produce(old.pages, (draft) => {
          draft[0]?.messages.unshift(newMessage);
        });

        return {
          pages: newState,
          pageParams: old.pageParams,
        };
      });
      chatForm.reset();
    },
  });

  return Paragraph.extend({
    addKeyboardShortcuts() {
      return {
        "Shift-Enter": () => {
          return this.editor.commands.newlineInCode();
        },
        // override enter command to submit form
        Enter: () =>
          this.editor.commands.command(() => {
            chatForm.handleSubmit((data) => {
              sendMessage.mutate({
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
  const chatForm = useFormContext();
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      CustomParagraph(),
      CodeBlockLowlight.configure({
        HTMLAttributes: {
          spellcheck: "false",
          autocomplete: "false",
        },
        languageClassPrefix: "codeblock-language-",
        lowlight,
      }),
    ],
    content,
    editorProps: {
      attributes: {
        form: "chatForm",
        class: "border-0 max-h-[100px] overflow-auto w-full py-3",
      },
    },
    onUpdate: ({ editor }) => {
      editor.getJSON();
      chatForm.setValue("text", editor.getText());
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

  // HACK: cursor positioning
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
        "group w-full rounded-lg border-2 border-warm-gray-400 px-3 py-2",
        {
          "!border-warm-gray-600": editor.isFocused,
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
