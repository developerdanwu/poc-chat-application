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

const ChatSidebar = () => {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const chatrooms = api.chatroom.getChatrooms.useQuery({
    searchKeyword: debouncedSearch,
  });

  const user = useUser();

  const { filterAuthedUserFromChatroomAuthors } = useApiTransformUtils();
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
    <div className="flex h-full flex-[0_0_256px] flex-col overflow-hidden  border-slate-300 bg-slate-900">
      <div
        className={cn(
          'flex h-full w-full flex-[0_0_48px] items-center justify-between border-b border-slate-300 px-5'
        )}
      >
        <div className="text-lg text-white">{user.user?.firstName}</div>
        <Link href="/new-message">
          <IconButton variant="ghost">
            <PencilIcon className="text-white" size={16} />
          </IconButton>
        </Link>
      </div>

      <div className="flex w-full flex-col space-y-3 overflow-auto pt-4">
        <Collapsible defaultOpen={true}>
          <div className="flex items-center space-x-2 pl-3">
            <CollapsibleTrigger asChild>
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
            {chatrooms.data?.chatrooms.map((chatroom) => {
              const filteredAuthors = filterAuthedUserFromChatroomAuthors(
                chatroom.authors
              );
              return (
                <Link key={chatroom.id} href={`/${chatroom.id}`}>
                  <ThreadListItem
                    chatroomId={chatroom.id}
                    authors={filteredAuthors}
                    selected={chatroomId === chatroom.id}
                    hasUnreadMessages={chatroom.unread_count > 0}
                    helperText={
                      chatroom.unread_count > 0 ? (
                        <div className="flex  h-5 w-7 items-center justify-center rounded-full bg-red-600 text-white">
                          <p className="text-detail">{chatroom.unread_count}</p>
                        </div>
                      ) : null
                    }
                    // TODO: setup page to let user fill in important details
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
