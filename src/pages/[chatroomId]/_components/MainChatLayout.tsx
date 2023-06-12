import React, { Suspense } from 'react';
import { cn } from '@/lib/utils';
import ChatSidebar from '@/pages/[chatroomId]/_components/left-sidebar/ChatSidebar';
import { MainChatWrapper } from '@/pages/[chatroomId]';
import MainContentLoading from '@/pages/[chatroomId]/_components/main/MainContentLoading';

const MainChatLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      className={cn(
        'bg-warm-gray-50 flex h-screen w-screen flex-row items-center  justify-center'
      )}
    >
      <div className={cn('flex h-full w-full flex-row')}>
        <ChatSidebar />
        <MainChatWrapper>
          <Suspense fallback={<MainContentLoading />}>{children}</Suspense>
        </MainChatWrapper>
      </div>
    </div>
  );
};

export default MainChatLayout;
