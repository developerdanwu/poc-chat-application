import React from 'react';
import dayjs from 'dayjs';
import { type RouterOutput } from '@/server/api/root';
import { safeJSONParse, useApiTransformUtils } from '@/lib/utils';
import { EditorContent, useEditor } from '@tiptap/react';
import {
  TiptapCodeBlockLight,
  TipTapParagraph,
  TipTapStarterKit,
} from '@/components/modules/TextEditor/extensions';
import TiptapEditorWrapper from '@/components/modules/TextEditor/TiptapEditorWrapper';

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
  isEdited,
  isLastMessageSenderEqualToCurrentMessageSender,
  differenceBetweenLastMessage,
  messageId,
  setIsEditing,
  author,
  variant = 'sender',
  sendDate,
  content,
}: {
  text: string;
  isEdited: boolean;
  isLastMessageSenderEqualToCurrentMessageSender: boolean;
  differenceBetweenLastMessage: number | undefined;
  messageId: number;
  content: string;
  setIsEditing: React.Dispatch<React.SetStateAction<number | undefined>>;
  author: RouterOutput['messaging']['getMessages']['messages'][number]['author'];
  sendDate: Date;
  variant?: 'sender' | 'receiver';
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
      {/*<div*/}
      {/*  className={cn(*/}
      {/*    'invisible absolute -top-4 right-6 z-50 flex items-center justify-center space-x-1 rounded-md  border border-black bg-white p-1 group-hover:visible'*/}
      {/*  )}*/}
      {/*>*/}
      {/*  {variant === 'sender' && (*/}
      {/*    <button*/}
      {/*      onClick={() => setIsEditing(messageId)}*/}
      {/*      className="btn-outline btn-square btn-xs btn border-0"*/}
      {/*    >*/}
      {/*      <RiEdit2Fill size={16} />*/}
      {/*    </button>*/}
      {/*  )}*/}
      {/*  <button className="btn-outline btn-square btn-xs btn border-0">*/}
      {/*    <RiMore2Fill size={16} />*/}
      {/*  </button>*/}
      {/*</div>*/}

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
          {isEdited && <p className="text-xs text-slate-400">(edited)</p>}
        </div>
      </div>
    </>
  );
};

export default ChatReplyItem;
