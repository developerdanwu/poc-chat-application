import { type NextPageWithLayout } from '@/pages/_app';
import React, { useRef } from 'react';
import { useRouter } from 'next/router';
import ChatWindow, {
  type ChatWindowRef,
} from '@/pages/[chatroomId]/_components/main/main-content/ChatWindow';
import SendMessagebar from '@/pages/[chatroomId]/_components/main/SendMessagebar';
import { ChatNameBar } from '@/pages/[chatroomId]/_components/main/top-controls/actions';
import MainChatLayout from '@/pages/[chatroomId]/_components/MainChatLayout';

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
      <ChatNameBar chatroomId={chatroomId} />
      <ChatWindow chatroomId={chatroomId} />
      <SendMessagebar chatroomId={chatroomId} chatWindowRef={chatWindowRef} />
    </div>
  );
};

ChatroomId.getLayout = function getLayout(page) {
  return <MainChatLayout>{page}</MainChatLayout>;
};

export default ChatroomId;
