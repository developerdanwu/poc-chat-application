import { type NextPageWithLayout } from '@/pages/_app';
import React from 'react';
import { useRouter } from 'next/router';
import ChatWindow from '@/pages/[chatroomId]/_components/main/main-content/ChatWindow';
import SendMessagebar from '@/pages/[chatroomId]/_components/main/SendMessagebar';
import { ChatNameBar } from '@/pages/[chatroomId]/_components/main/top-controls/actions';
import MainChatLayout from '@/pages/[chatroomId]/_components/MainChatLayout';
import { RoomProvider } from '../../../liveblocks.config';
import SendMessagebarProvider from '@/pages/[chatroomId]/_components/main/SendMessagebar/SendMessagebarProvider';

const ChatroomId: NextPageWithLayout = () => {
  const router = useRouter();
  const chatroomId =
    typeof router.query.chatroomId === 'string'
      ? router.query.chatroomId
      : undefined;

  if (!chatroomId) {
    return null;
  }

  return (
    <RoomProvider id={chatroomId} initialPresence={{}}>
      <div className="flex h-full w-full flex-col">
        <ChatNameBar chatroomId={chatroomId} />
        <ChatWindow chatroomId={chatroomId} />
        <SendMessagebarProvider>
          <SendMessagebar chatroomId={chatroomId} />
        </SendMessagebarProvider>
      </div>
    </RoomProvider>
  );
};

ChatroomId.getLayout = function getLayout(page) {
  return <MainChatLayout>{page}</MainChatLayout>;
};

export default ChatroomId;
