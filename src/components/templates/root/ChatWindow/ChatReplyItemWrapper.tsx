import React from 'react';
import { cn, useApiTransformUtils } from '@/utils/utils';
import Avatar from '@/components/elements/Avatar';
import { RouterOutput } from '@/server/api/root';

const ChatReplyItemWrapper = ({
  children,
  communicator,
  author,
}: {
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
      className={cn(
        'group chat chat-start relative py-2 px-6 hover:bg-warm-gray-200'
      )}
    >
      <Avatar alt={fullName.slice(0, 2)} />
      {children}
    </div>
  );
};

export default ChatReplyItemWrapper;
