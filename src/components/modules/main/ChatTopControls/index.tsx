import React from 'react';
import { api } from '@/lib/api';
import {
  ChatBranches,
  ChatNameBar,
} from '@/components/modules/main/ChatTopControls/actions';
import { ChatroomType } from '@prisma-generated/generated/types';

const ChatTopControls = ({ chatroomId }: { chatroomId: string }) => {
  const chatroomDetail = api.messaging.getChatroom.useQuery({
    chatroomId: chatroomId,
  });

  if (!chatroomDetail.data) {
    return null;
  }

  if (chatroomDetail.data.type === ChatroomType.AI_CHATROOM) {
    return (
      <>
        <ChatNameBar chatroomId={chatroomId} />
        <ChatBranches />
      </>
    );
  }

  if (chatroomDetail.data.type === ChatroomType.HUMAN_CHATROOM) {
    return (
      <>
        <ChatNameBar chatroomId={chatroomId} />
      </>
    );
  }

  throw new Error('Unknown chatroom type for ChatTopControls');
};

export default ChatTopControls;
