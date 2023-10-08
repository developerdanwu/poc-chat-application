import { Paragraph } from '@tiptap/extension-paragraph';
import React, { useRef, useState } from 'react';
import { api } from '@/lib/api';
import { FormProvider, useForm } from 'react-hook-form';
import produce from 'immer';
import { type InfiniteData } from '@tanstack/react-query';
import { type RouterOutput } from '@/server/api/root';
import HookFormTiptapEditor from '@/components/elements/text-editor/HookFormTiptapEditor';
import { cn, safeJSONParse, useApiTransformUtils } from '@/lib/utils';
import EditorMenuBar from '@/components/elements/text-editor/EditorMenuBar';
import { EditorContent } from '@tiptap/react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/elements/avatar';
import dayjs from 'dayjs';
import { type Author } from '@prisma-generated/generated/types';
import { RichTextDisplay } from '@/pages/[chatroomId]/_components/main/RichTextEditor';
import { Slate, withReact } from 'slate-react';
import { withHistory } from 'slate-history';
import { createEditor } from 'slate';
import { SetNodeToDecorations } from '@/pages/[chatroomId]/_components/main/RichTextEditor/blocks/codeBlock';

const EditableWrapper = ({
  children,
}: {
  children: (props: {
    isEditing: boolean;
    setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
  }) => React.ReactNode;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  return <>{children({ isEditing, setIsEditing })}</>;
};

const TextEditorParagraph = ({
  onClickEnter,
}: {
  onClickEnter: () => void;
}) => {
  return Paragraph.extend({
    addKeyboardShortcuts() {
      return {
        'Shift-Enter': () => {
          return this.editor.commands.newlineInCode();
        },
        // override enter command to submit form
        Enter: () =>
          this.editor.commands.command(() => {
            onClickEnter();
            return true;
          }),
      };
    },
  });
};

const ChatReplyEditingItem = ({
  text,
  content,
  setIsEditing,
  clientMessageId,
  chatroomId,
}: {
  chatroomId: string;
  clientMessageId: number;
  text: string;
  setIsEditing: React.Dispatch<React.SetStateAction<number | undefined>>;
  content: string;
}) => {
  const trpcUtils = api.useContext();
  const editChatForm = useForm({
    defaultValues: {
      text,
      content,
    },
  });

  const formRef = useRef<HTMLFormElement>(null);

  const editMessage = api.messaging.editMessage.useMutation({
    onMutate: (data) => {
      const oldData = trpcUtils.messaging.getMessages.getInfiniteData({
        chatroomId,
      });
      trpcUtils.messaging.getMessages.setInfiniteData({ chatroomId }, (old) => {
        if (!old) {
          return {
            pages: [{ messages: [], next_cursor: 0 }],
            pageParams: [],
          };
        }

        const newState = produce(old.pages, (draft) => {
          draft.forEach((item) => {
            item.messages.forEach((message) => {
              if (message.client_message_id === data.clientMessageId) {
                message.text = data.text;
                message.content = data.content;
                message.is_edited = true;
              }
            });
          });
        });

        return {
          pages: newState,
          pageParams: old.pageParams,
        };
      });

      setIsEditing(undefined);

      return {
        oldData,
      };
    },
    onError: (error, variables, context) => {
      const contextCast = context as {
        oldData?: InfiniteData<RouterOutput['messaging']['getMessages']>;
      };
      if (contextCast.oldData) {
        trpcUtils.messaging.getMessages.setInfiniteData(
          { chatroomId },
          () => contextCast.oldData
        );
      }
    },
  });

  return (
    <FormProvider {...editChatForm}>
      <form
        className="w-full"
        ref={formRef}
        onSubmit={editChatForm.handleSubmit((data) => {
          editMessage.mutate({
            clientMessageId,
            text: data.text,
            content: data.content,
          });
        })}
      >
        <HookFormTiptapEditor fieldName="content">
          {(editor) => {
            return (
              <div
                className={cn(
                  'border-warm-gray-400  group w-full rounded-lg border px-3 py-2',
                  {
                    'border-warm-gray-600': editor.isFocused,
                  }
                )}
              >
                <EditorMenuBar editor={editor} />
                <EditorContent editor={editor} />
                <div className="flex justify-between">
                  <div></div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setIsEditing(undefined);
                      }}
                      // disabled={!formState.isValid}
                      className={cn('btn-outline btn-sm btn', {
                        // 'btn-disabled': !formState.isValid,
                      })}
                    >
                      cancel
                    </button>
                    <button
                      type="submit"
                      // disabled={!formState.isValid}
                      className={cn('btn-primary btn-sm btn', {
                        // 'btn-disabled': !formState.isValid,
                      })}
                    >
                      save
                    </button>
                  </div>
                </div>
              </div>
            );
          }}
        </HookFormTiptapEditor>
      </form>
    </FormProvider>
  );
};
const ChatReplyAvatar = ({
  differenceBetweenLastMessage,
  firstName,
  lastName,
  sendDate,
  isLastMessageSenderEqualToCurrentMessageSender,
}: {
  sendDate: Date;
  firstName: string;
  lastName: string;
  differenceBetweenLastMessage: number | undefined;
  isLastMessageSenderEqualToCurrentMessageSender: boolean;
}) => {
  const { getFullName } = useApiTransformUtils();
  const fullName = getFullName({
    firstName: firstName,
    lastName: lastName,
    fallback: 'Untitled',
  });

  if (
    !isLastMessageSenderEqualToCurrentMessageSender ||
    differenceBetweenLastMessage === undefined ||
    differenceBetweenLastMessage > 5
  ) {
    return (
      <Avatar size="lg">
        <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
        <AvatarFallback>{fullName}</AvatarFallback>
      </Avatar>
    );
  }

  return (
    <div className="invisible w-10 pt-[2px] text-xs font-normal text-slate-400 group-hover:visible">
      {dayjs.utc(sendDate).local().format('hh:mm')}
    </div>
  );
};
export const ChatReplyItemWrapper = ({
  isLastMessageSenderEqualToCurrentMessageSender,
  sendDate,
  differenceBetweenLastMessage,
  children,
  communicator,
  author,
}: {
  isLastMessageSenderEqualToCurrentMessageSender: boolean;
  differenceBetweenLastMessage: number | undefined;
  sendDate: Date;
  author: Pick<Author, 'first_name' | 'last_name'>;
  children: React.ReactNode;
  communicator: 'sender' | 'receiver';
}) => {
  return (
    <div
      data-communicator={communicator}
      className={cn(
        'group relative flex space-x-3 py-2 px-6 hover:bg-slate-50'
      )}
    >
      <ChatReplyAvatar
        isLastMessageSenderEqualToCurrentMessageSender={
          isLastMessageSenderEqualToCurrentMessageSender
        }
        sendDate={sendDate}
        differenceBetweenLastMessage={differenceBetweenLastMessage}
        lastName={author.last_name}
        firstName={author.first_name}
      />
      {children}
    </div>
  );
};

const ChatReplyItemHeader = ({
  isLastMessageSenderEqualToCurrentMessageSender,
  differenceBetweenLastMessage,
  firstName,
  lastName,
  sendDate,
}: {
  isLastMessageSenderEqualToCurrentMessageSender: boolean;
  sendDate: Date;
  firstName: string;
  lastName: string;
  differenceBetweenLastMessage: number | undefined;
}) => {
  const { getFullName } = useApiTransformUtils();
  const fullName = getFullName({
    firstName: firstName,
    lastName: lastName,
    fallback: 'Untitled',
  });

  if (
    !isLastMessageSenderEqualToCurrentMessageSender ||
    differenceBetweenLastMessage === undefined ||
    differenceBetweenLastMessage > 5
  ) {
    return (
      <div className="flex items-center space-x-2 text-sm font-semibold">
        <p className="text-p font-semibold text-slate-700">{fullName}</p>
        <div className="text-xs font-normal text-slate-400">
          {dayjs.utc(sendDate).local().format('hh:mm a')}
        </div>
      </div>
    );
  }

  return null;
};
export const ChatReplyItem = ({
  text,
  isLastMessageSenderEqualToCurrentMessageSender,
  differenceBetweenLastMessage,
  author,
  sendDate,
  content,
}: {
  text: string;
  isLastMessageSenderEqualToCurrentMessageSender: boolean;
  differenceBetweenLastMessage: number | undefined;
  content: string;
  author: Pick<Author, 'first_name' | 'last_name'>;
  sendDate: Date;
}) => {
  const [editor] = useState(() => withHistory(withReact(createEditor())));

  return (
    <>
      <div className="flex w-full flex-col space-y-2">
        <ChatReplyItemHeader
          isLastMessageSenderEqualToCurrentMessageSender={
            isLastMessageSenderEqualToCurrentMessageSender
          }
          sendDate={sendDate}
          differenceBetweenLastMessage={differenceBetweenLastMessage}
          lastName={author.last_name}
          firstName={author.first_name}
        />

        <div className="relative flex flex-col space-y-2">
          <Slate editor={editor} initialValue={safeJSONParse(content)}>
            <SetNodeToDecorations />
            <RichTextDisplay readOnly />
          </Slate>
        </div>
      </div>
    </>
  );
};
