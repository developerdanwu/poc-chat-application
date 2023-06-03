import React from 'react';
import { cn } from '@/lib/utils';
import ChatSidebar from '@/components/templates/root/ChatSidebar/ChatSidebar';
import { type NextPageWithLayout } from '@/pages/_app';

const Home: NextPageWithLayout = () => {
  return (
    <div
      className={cn(
        'flex h-screen w-screen flex-row items-center justify-center'
      )}
    >
      <div className={cn('flex h-full w-full flex-row')}>
        <ChatSidebar />
      </div>
    </div>
  );
};

// Home.getLayout = function getLayout(page) {
//   return (
//     <div
//       className={cn(
//         'flex h-screen w-screen flex-row items-center justify-center'
//       )}
//     >
//       <div className={cn('flex h-full w-full flex-row')}>
//         <ChatSidebar />
//         {page}
//       </div>
//     </div>
//   );
// };

export default Home;
