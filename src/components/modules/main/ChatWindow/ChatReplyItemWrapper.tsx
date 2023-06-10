import React from 'react';
import { cn, useApiTransformUtils } from '@/lib/utils';
import { type RouterOutput } from '@/server/api/root';
import dayjs from 'dayjs';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/elements/avatar';

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

const ChatReplyItemWrapper = ({
  isLastMessageSenderEqualToCurrentMessageSender,
  sendDate,
  differenceBetweenLastMessage,
  isEditing,
  children,
  communicator,
  author,
}: {
  isLastMessageSenderEqualToCurrentMessageSender: boolean;
  differenceBetweenLastMessage: number | undefined;
  sendDate: Date;
  isEditing: boolean;
  author: RouterOutput['messaging']['getMessages']['messages'][number]['author'];
  children: React.ReactNode;
  communicator: 'sender' | 'receiver';
}) => {
  return (
    <div
      data-communicator={communicator}
      className={cn('group relative flex space-x-3 py-2 px-6', {
        'hover:bg-slate-100': !isEditing,
        'bg-yellow-100': isEditing,
      })}
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

export default ChatReplyItemWrapper;