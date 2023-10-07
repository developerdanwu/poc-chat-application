import { type NextPageWithLayout } from '@/pages/_app';
import React, { useRef } from 'react';
import { useRouter } from 'next/router';
import ChatWindow, {
  ChatWindowLoading,
  type ChatWindowRef,
} from '@/pages/[chatroomId]/_components/main/main-content/ChatWindow';
import SendMessagebar from '@/pages/[chatroomId]/_components/main/SendMessagebar';
import { api } from '@/lib/api';
import { ChatroomType } from '@prisma-generated/generated/types';
import {
  ChatBranches,
  ChatNameBar,
} from '@/pages/[chatroomId]/_components/main/top-controls/actions';
import MainChatLayout from '@/pages/[chatroomId]/_components/MainChatLayout';

export const MainChatWrapper = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center overflow-hidden ">
      {children}
    </div>
  );
};

const MainContent = ({ chatroomId }: { chatroomId: string }) => {
  const chatroomDetail = api.chatroom.getChatroom.useQuery({
    chatroomId: chatroomId,
  });

  const router = useRouter();

  if (!chatroomDetail.data) {
    return null;
  }

  if (chatroomDetail.data.type === ChatroomType.AI_CHATROOM) {
    if (chatroomDetail.data.branches.length === 0) {
      return null;
    }

    const branchId = chatroomDetail.data.branches[0]?.id;
    if (branchId) {
      router.push(`/${chatroomId}/${branchId}`);
    }
    return <ChatWindowLoading />;
  }

  if (chatroomDetail.data.type === ChatroomType.HUMAN_CHATROOM) {
    return <ChatWindow chatroomId={chatroomId} />;
  }

  throw new Error('unknown chatroom type');
};

const TopControls = ({ chatroomId }: { chatroomId: string }) => {
  const chatroomDetail = api.chatroom.getChatroom.useQuery({
    chatroomId: chatroomId,
  });

  if (!chatroomDetail.data) {
    return null;
  }

  if (chatroomDetail.data.type === ChatroomType.AI_CHATROOM) {
    return (
      <>
        <ChatNameBar chatroomId={chatroomId} />
        <ChatBranches
          chatroomId={chatroomId}
          currentBranchId=""
          branches={chatroomDetail.data.branches}
        />
      </>
    );
  }

  if (chatroomDetail.data.type === ChatroomType.HUMAN_CHATROOM) {
    return (
      <div className="flex-shrink-0">
        <ChatNameBar chatroomId={chatroomId} />
      </div>
    );
  }

  throw new Error('Unknown chatroom type for ChatTopControls');
};

const ChatroomId: NextPageWithLayout = () => {
  const router = useRouter();
  const chatroomId =
    typeof router.query.chatroomId === 'string'
      ? router.query.chatroomId
      : undefined;
  const chatWindowRef = useRef<ChatWindowRef>(null);

  if (!chatroomId) {
    return null;
  }

  return (
    <div className="flex h-full w-full flex-col">
      <TopControls chatroomId={chatroomId} />
      <ChatWindow chatroomId={chatroomId} />;
      <SendMessagebar chatroomId={chatroomId} chatWindowRef={chatWindowRef} />
    </div>
  );
};

ChatroomId.getLayout = function getLayout(page) {
  return <MainChatLayout>{page}</MainChatLayout>;
};

export default ChatroomId;
