import React from 'react';
import { cn, useApiTransformUtils } from '@/utils/utils';
import Avatar from '@/components/elements/Avatar';
import { RouterOutput } from '@/server/api/root';
import dayjs from 'dayjs';

const ChatReplyAvatar = ({
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

  console.log('DIFF', differenceBetweenLastMessage);

  if (
    differenceBetweenLastMessage === undefined ||
    differenceBetweenLastMessage > 5
  ) {
    return <Avatar alt={fullName.slice(0, 2)} />;
  }

  return (
    <div className="invisible w-10 pt-[2px] text-xs font-normal text-warm-gray-400 group-hover:visible">
      {dayjs(sendDate).format('hh:mm')}
    </div>
  );
};

const ChatReplyItemWrapper = ({
  sendDate,
  differenceBetweenLastMessage,
  isEditing,
  children,
  communicator,
  author,
}: {
  differenceBetweenLastMessage: number | undefined;
  sendDate: string;
  isEditing: boolean;
  author: RouterOutput['messaging']['getMessages']['messages'][number]['author'];
  children: React.ReactNode;
  communicator: 'sender' | 'receiver';
}) => {
  const { getFullName } = useApiTransformUtils();
  const fullName = getFullName({
    firstName: author.first_name,
    lastName: author.last_name,
    fallback: 'Untitled',
  });
  return (
    <div
      data-communicator={communicator}
      className={cn('group chat chat-start relative py-2 px-6', {
        'hover:bg-warm-gray-200': !isEditing,
        'bg-yellow-100': isEditing,
      })}
    >
      <ChatReplyAvatar
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
