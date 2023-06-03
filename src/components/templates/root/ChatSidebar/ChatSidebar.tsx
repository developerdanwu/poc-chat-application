import React, { useState } from 'react';
import { api } from '@/lib/api';
import { cn, useApiTransformUtils } from '@/lib/utils';
import ThreadListItem from '@/components/templates/root/ThreadListItem';
import { notEmpty } from '@/lib/ts-utils';
import { useRouter } from 'next/router';
import { useDebounce } from 'react-use';
import RadialProgress from '@/components/elements/RadialProgress';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { IconButton } from '@/components/elements/IconButton';
import { PencilIcon } from 'lucide-react';

const ChatSidebar = () => {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const chatrooms = api.messaging.getChatrooms.useQuery({
    searchKeyword: debouncedSearch,
  });
  const user = useUser();

  const { filterAuthedUserFromChatroomAuthors, getFullName } =
    useApiTransformUtils();
  useDebounce(
    () => {
      setDebouncedSearch(search);
    },
    100,
    [search]
  );

  const chatroomId =
    typeof router.query.chatroomId === 'string' ? router.query.chatroomId : '';

  return (
    <div className="flex h-full flex-[0_0_256px] flex-col overflow-hidden border-r-2 border-black bg-slate-900">
      <div
        className={cn(
          'mb-4 flex h-full w-full flex-[0_0_60px] items-center justify-between border-b border-slate-300 px-5'
        )}
      >
        <div className={'text-h4 text-white'}>{user.user?.firstName}</div>
        <Link href="/new-message">
          <IconButton size={'lg'} variant={'white'} className={'rounded-full'}>
            <PencilIcon size={16} />
          </IconButton>
        </Link>
      </div>

      <div className="flex w-full flex-col overflow-auto p-3">
        {chatrooms.isLoading ? (
          <RadialProgress size={20} />
        ) : (
          chatrooms.data?.map((chatroom) => {
            return (
              <Link key={chatroom.id} href={`/${chatroom.id}`}>
                <ThreadListItem
                  selected={chatroomId === chatroom.id}
                  // TODO: setup page to let user fill in important details
                  name={filterAuthedUserFromChatroomAuthors(chatroom.authors)
                    ?.map((author) =>
                      getFullName({
                        firstName: author?.first_name,
                        lastName: author?.last_name,
                        fallback: 'Untitled',
                      })
                    )
                    .filter(notEmpty)
                    .join(', ')}
                />
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
