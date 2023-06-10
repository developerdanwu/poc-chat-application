import React from 'react';
import dayjs from 'dayjs';
import { safeJSONParse, useApiTransformUtils } from '@/lib/utils';
import { EditorContent, useEditor } from '@tiptap/react';
import {
  TiptapCodeBlockLight,
  TipTapParagraph,
  TipTapStarterKit,
} from '@/components/modules/TextEditor/extensions';
import TiptapEditorWrapper from '@/components/modules/TextEditor/TiptapEditorWrapper';
import { type Author } from '../../../../prisma/generated/types';

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

const ChatReplyItem = ({
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
  const editor = useEditor({
    extensions: [TipTapStarterKit, TipTapParagraph, TiptapCodeBlockLight],
    editable: false,
    content: safeJSONParse(content) || text,
  });

  if (!editor) {
    return null;
  }

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
          <TiptapEditorWrapper
            editable={false}
            content={safeJSONParse(content) || text}
          >
            {(editor) => {
              return <EditorContent editor={editor} />;
            }}
          </TiptapEditorWrapper>
        </div>
      </div>
    </>
  );
};

export default ChatReplyItem;
