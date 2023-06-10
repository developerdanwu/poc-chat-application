import { type NextPageWithLayout } from '@/pages/_app';
import { cn } from '@/lib/utils';
import ChatSidebar from '@/components/modules/left-sidebar/ChatSidebar';
import React, { useRef } from 'react';
import { useRouter } from 'next/router';
import ChatWindow, {
  type ChatWindowRef,
} from '@/components/modules/main/ChatWindow';
import ChatTopControls from '@/components/modules/main/ChatTopControls';
import SendMessagebar from '@/components/modules/main/SendMessagebar';

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
      <ChatTopControls chatroomId={chatroomId} />
      <ChatWindow
        ref={chatWindowRef}
        key={chatroomId}
        chatroomId={chatroomId}
      />
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
