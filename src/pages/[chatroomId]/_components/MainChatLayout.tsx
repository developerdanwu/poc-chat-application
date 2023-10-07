import React, { Suspense } from 'react';
import { cn } from '@/lib/utils';
import ChatSidebar from '@/pages/[chatroomId]/_components/left-sidebar/ChatSidebar';
import MainContentLoading from '@/pages/[chatroomId]/_components/main/MainContentLoading';

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
