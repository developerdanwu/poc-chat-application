import React, { useState } from 'react';
import { api } from '@/lib/api';
import { cn, useApiTransformUtils } from '@/lib/utils';
import { useRouter } from 'next/router';
import { useDebounce } from 'react-use';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { IconButton } from '@/components/elements/IconButton';
import { ChevronDownIcon, PencilIcon } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/elements/collapsible';
import ThreadListItem from '@/pages/[chatroomId]/_components/left-sidebar/ThreadListItem';
import { notEmpty } from '@/lib/ts-utils';
import { AiModelsSection } from '@/pages/[chatroomId]/_components/left-sidebar/sections';

const ChatSidebar = () => {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const chatrooms = api.chatroom.getChatrooms.useQuery({
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
    <div className="flex h-full flex-[0_0_256px] flex-col overflow-hidden border-r border-slate-300 bg-slate-900">
      <div
        className={cn(
          'flex h-full w-full flex-[0_0_48px] items-center justify-between border-b border-slate-300 px-5'
        )}
      >
        <div className="text-h4 text-white">{user.user?.firstName}</div>
        <Link href="/src/pages/new-message">
          <IconButton variant="white" className="rounded-full">
            <PencilIcon size={16} />
          </IconButton>
        </Link>
      </div>

      <div className="flex w-full flex-col space-y-3 overflow-auto pt-4">
        <AiModelsSection />
        <Collapsible defaultOpen={true}>
          <div className="flex items-center space-x-2 pl-3">
            <CollapsibleTrigger>
              <IconButton
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:bg-slate-700 hover:text-slate-400"
              >
                <ChevronDownIcon size={16} />
              </IconButton>
            </CollapsibleTrigger>
            <div className="text-body text-slate-400">Direct messages</div>
          </div>
          <CollapsibleContent className="px-3">
            {chatrooms.data?.map((chatroom) => {
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
            })}
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};

export default ChatSidebar;
