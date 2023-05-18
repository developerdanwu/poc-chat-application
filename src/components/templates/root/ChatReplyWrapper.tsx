import React from 'react';
import Avatar from '@/components/elements/Avatar';
import dayjs from 'dayjs';
import { type RouterOutput } from '@/server/api/root';
import { useApiTransformUtils } from '@/utils/utils';

const ChatReplyWrapper = ({
  children,
  author,
  variant = 'sender',
  sendDate,
}: {
  author: RouterOutput['messaging']['getMessages']['messages'][number]['author'];
  sendDate: string;
  variant?: 'sender' | 'receiver';
  children: React.ReactNode;
}) => {
  const { getFullName } = useApiTransformUtils();
  const fullName = getFullName({
    firstName: author.first_name,
    lastName: author.last_name,
    fallback: 'Untitled',
  });
  return (
    <div
      data-communicator={variant === 'sender' ? 'sender' : 'receiver'}
      className="chat chat-start px-6"
    >
      <Avatar alt={fullName.slice(0, 2)} />
      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-2 text-sm font-semibold">
          <p>{fullName}</p>
          <div className="text-xs font-normal text-warm-gray-400">
            {dayjs.utc(sendDate).local().format('hh:mm a')}
          </div>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

export default ChatReplyWrapper;
