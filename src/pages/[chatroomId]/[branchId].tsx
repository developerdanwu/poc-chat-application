import React, { type RefObject, useRef } from 'react';
import { cn } from '@/lib/utils';
import ChatSidebar from '@/components/modules/left-sidebar/ChatSidebar';
import { MainChatWrapper } from '@/pages/[chatroomId]/index';
import { type NextPageWithLayout } from '@/pages/_app';
import { api } from '@/lib/api';
import { ChatroomType } from '@prisma-generated/generated/types';
import {
  ChatBranches,
  ChatNameBar,
} from '@/components/modules/main/top-controls/actions';
import { useRouter } from 'next/router';
import ChatWindow, {
  type ChatWindowRef,
} from '@/components/modules/main/main-content/ChatWindow';
import SendMessagebar from '@/components/modules/main/SendMessagebar';

const TopControls = ({
  chatroomId,
  branchId,
}: {
  chatroomId: string;
  branchId: string;
}) => {
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
          currentBranchId={branchId}
          branches={chatroomDetail.data.branches}
        />
      </>
    );
  }

  throw new Error('Unknown chatroom type for ChatTopControls');
};

const MainContent = ({
  chatroomId,
  chatWindowRef,
}: {
  chatroomId: string;
  chatWindowRef: RefObject<ChatWindowRef>;
}) => {
  const chatroomDetail = api.chatroom.getChatroom.useQuery({
    chatroomId: chatroomId,
  });

  if (!chatroomDetail.data) {
    return null;
  }

  if (chatroomDetail.data.type === ChatroomType.CHATROOM_BRANCH) {
    return <ChatWindow ref={chatWindowRef} chatroomId={chatroomId} />;
  }

  throw new Error('unknown chatroom type');
};

const ChatroomBranch: NextPageWithLayout = () => {
  const router = useRouter();
  const chatWindowRef = useRef<ChatWindowRef>(null);
  const chatroomId =
    typeof router.query.chatroomId === 'string'
      ? router.query.chatroomId
      : undefined;

  const branchId =
    typeof router.query.branchId === 'string'
      ? router.query.branchId
      : undefined;

  if (!chatroomId || !branchId) {
    return null;
  }

  return (
    <MainChatWrapper>
      <TopControls chatroomId={chatroomId} branchId={branchId} />
      <MainContent chatroomId={branchId} chatWindowRef={chatWindowRef} />
      <SendMessagebar chatroomId={branchId} chatWindowRef={chatWindowRef} />
    </MainChatWrapper>
  );
};

export default ChatroomBranch;

ChatroomBranch.getLayout = function getLayout(page) {
  return (
    <div
      className={cn(
        'bg-warm-gray-50 flex h-screen w-screen flex-row items-center  justify-center'
      )}
    >
      <div className={cn('flex h-full w-full flex-row')}>
        <ChatSidebar />
        <MainChatWrapper>{page}</MainChatWrapper>
      </div>
    </div>
  );
};
