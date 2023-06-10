import React from 'react';
import { api } from '@/lib/api';
import { ChatBranches } from '@/components/modules/main/ChatroomActions/actions';
import { ChatroomType } from '../../../../../prisma/generated/types';

const ChatroomActions = ({ chatroomId }: { chatroomId: string }) => {
  const chatroomDetail = api.messaging.getChatroom.useQuery({
    chatroomId: chatroomId,
  });

  if (!chatroomDetail.data) {
    return null;
  }

  if (chatroomDetail.data.type === ChatroomType.AI_CHATROOM) {
    return <ChatBranches />;
  }
  return null;
};

export default ChatroomActions;
