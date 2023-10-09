import React, { useState } from 'react';
import { cn, safeJSONParse, useApiTransformUtils } from '@/lib/utils';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/elements/avatar';
import dayjs from 'dayjs';
import { type Author } from '@prisma-generated/generated/types';
import BaseRichTextEditor from '@/components/modules/rich-text/BaseRichTextEditor';

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
  isLastMessageSenderEqualToCurrentMessageSender,
  differenceBetweenLastMessage,
  author,
  sendDate,
  content,
}: {
  isLastMessageSenderEqualToCurrentMessageSender: boolean;
  differenceBetweenLastMessage: number | undefined;
  content: string;
  author: Pick<Author, 'first_name' | 'last_name'>;
  sendDate: Date;
}) => {
  return (
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
        <BaseRichTextEditor
          slotProps={{
            root: {
              initialValue: safeJSONParse(content),
            },
            editable: {
              readOnly: true,
            },
          }}
        />
      </div>
    </div>
  );
};
