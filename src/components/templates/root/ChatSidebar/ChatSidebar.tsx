import React, { useState } from 'react';
import { api } from '@/utils/api';
import { cn, useApiTransformUtils } from '@/utils/utils';
import Input from '@/components/elements/Input';
import ThreadListItem from '@/components/templates/root/ThreadListItem';
import { notEmpty } from '@/utils/ts-utils';
import { useRouter } from 'next/router';
import { useDebounce } from 'react-use';
import RadialProgress from '@/components/elements/RadialProgress';
import Link from 'next/link';
import { RiPencilLine } from 'react-icons/ri';

const ChatSidebar = () => {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const chatrooms = api.messaging.getChatrooms.useQuery({
    searchKeyword: debouncedSearch,
  });

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
    <div className="flex h-full flex-[0_0_256px] flex-col overflow-hidden border-r-2 border-black bg-warm-gray-200 ">
      <div
        className={cn(
          'mb-4 flex h-full w-full flex-[0_0_60px] items-center space-x-2 border-b-2 border-black px-3'
        )}
      >
        <Input
          spellCheck={false}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Link href="/new-message">
          <button className={cn('btn-outline btn-sm btn-circle btn')}>
            <RiPencilLine />
          </button>
        </Link>
      </div>

      <div className="flex w-full flex-col overflow-auto p-3">
        {chatrooms.isLoading ? (
          <RadialProgress className="self-center" />
        ) : (
          chatrooms.data?.chatrooms?.map((chatroom) => {
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
