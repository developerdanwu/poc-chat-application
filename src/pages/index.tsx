import React from 'react';
import { type NextPageWithLayout } from '@/pages/_app';
import { api } from '@/lib/api';
import { useRouter } from 'next/router';

const Home: NextPageWithLayout = () => {
  const chatrooms = api.chatroom.getChatrooms.useQuery();
  const router = useRouter();

  if (chatrooms.data && chatrooms.data.length > 0) {
    const chatroom = chatrooms.data[0];
    if (chatroom) {
      router.push(`/${chatroom.id}`);
    }
  } else {
    router.push('/new-message');
  }

  return <div className="h-screen w-[256px] bg-slate-900" />;
};

export default Home;
