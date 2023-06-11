import { type NextPageWithLayout } from '@/pages/_app';
import { cn } from '@/lib/utils';
import ChatSidebar from '@/components/modules/left-sidebar/ChatSidebar';
import React, { useRef } from 'react';
import { useRouter } from 'next/router';
import ChatWindow, {
  type ChatWindowRef,
} from '@/components/modules/main/main-content/ChatWindow';
import SendMessagebar from '@/components/modules/main/SendMessagebar';
import { api } from '@/lib/api';
import { ChatroomType } from '@prisma-generated/generated/types';
import {
  ChatBranches,
  ChatNameBar,
} from '@/components/modules/main/top-controls/actions';

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
  const chatroomDetail = api.messaging.getChatroom.useQuery({
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

    router.push(`/${chatroomId}/${chatroomDetail.data.branches[0].id}`);
    return null;
  }

  if (chatroomDetail.data.type === ChatroomType.HUMAN_CHATROOM) {
    return <ChatWindow chatroomId={chatroomId} />;
  }

  throw new Error('unknown chatroom type');
};

const TopControls = ({ chatroomId }: { chatroomId: string }) => {
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
        <ChatBranches
          currentBranchId=""
          branches={chatroomDetail.data.branches}
        />
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
    <MainChatWrapper>
      <TopControls chatroomId={chatroomId} />
      <MainContent chatroomId={chatroomId} />
      <SendMessagebar chatroomId={chatroomId} chatWindowRef={chatWindowRef} />
    </MainChatWrapper>
  );
};

ChatroomId.getLayout = function getLayout(page) {
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

export default ChatroomId;
