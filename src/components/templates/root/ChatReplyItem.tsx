import React from 'react';
import dayjs from 'dayjs';
import { type RouterOutput } from '@/server/api/root';
import { cn, useApiTransformUtils } from '@/utils/utils';
import { RiEdit2Fill, RiMore2Fill } from 'react-icons/ri';
import { EditorContent, useEditor } from '@tiptap/react';
import {
  TiptapCodeBlockLight,
  TipTapStarterKit,
} from '@/components/modules/TextEditor/utils';
import { Paragraph } from '@tiptap/extension-paragraph';

const ChatReplyItemHeader = ({
  differenceBetweenLastMessage,
  firstName,
  lastName,
  sendDate,
}: {
  sendDate: string;
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
    differenceBetweenLastMessage === undefined ||
    differenceBetweenLastMessage > 5
  ) {
    return (
      <div className="flex items-center space-x-2 text-sm font-semibold">
        <p>{fullName}</p>
        <div className="text-xs font-normal text-warm-gray-400">
          {dayjs.utc(sendDate).local().format('hh:mm a')}
        </div>
      </div>
    );
  }

  return null;
};

const ChatReplyItem = ({
  differenceBetweenLastMessage,
  messageId,
  setIsEditing,
  author,
  variant = 'sender',
  sendDate,
  content,
}: {
  differenceBetweenLastMessage: number | undefined;
  messageId: number;
  content: string;
  setIsEditing: React.Dispatch<React.SetStateAction<number | undefined>>;
  author: RouterOutput['messaging']['getMessages']['messages'][number]['author'];
  sendDate: string;
  variant?: 'sender' | 'receiver';
}) => {
  const { getFullName } = useApiTransformUtils();
  const editor = useEditor({
    extensions: [TipTapStarterKit, Paragraph, TiptapCodeBlockLight],
    editable: false,
    content,
  });
  const fullName = getFullName({
    firstName: author.first_name,
    lastName: author.last_name,
    fallback: 'Untitled',
  });
  return (
    <>
      <div
        className={cn(
          'invisible absolute -top-4 right-6 z-50 flex items-center justify-center space-x-1 rounded-md  border border-black bg-warm-gray-100 p-1 group-hover:visible'
        )}
      >
        {variant === 'sender' && (
          <button
            onClick={() => setIsEditing(messageId)}
            className={'btn-outline btn-square btn-xs btn border-0'}
          >
            <RiEdit2Fill size={16} />
          </button>
        )}
        <button className={'btn-outline btn-square btn-xs btn border-0'}>
          <RiMore2Fill size={16} />
        </button>
      </div>

      <div className="flex w-full flex-col space-y-2">
        <ChatReplyItemHeader
          sendDate={sendDate}
          differenceBetweenLastMessage={differenceBetweenLastMessage}
          lastName={author.last_name}
          firstName={author.first_name}
        />

        <div>
          <EditorContent editor={editor} />
        </div>
      </div>
    </>
  );
};

export default ChatReplyItem;
