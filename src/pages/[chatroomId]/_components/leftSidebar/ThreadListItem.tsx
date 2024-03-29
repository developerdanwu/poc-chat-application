import React from 'react';
import {cn, useApiTransformUtils} from '@/lib/utils';
import {Avatar, AvatarBadge, AvatarFallback, AvatarImage,} from '@/components/Avatar';
import {type RouterOutput} from '@/server/api/root';
import {notEmpty} from '@/lib/ts-utils';
import {api} from '@/lib/api';

const ThreadListItem = ({
                            authors,
                            selected,
                            helperText,
                            chatroomId,
                            hasUnreadMessages,
                        }: {
    hasUnreadMessages: boolean;
    chatroomId: string;
    authors: RouterOutput['chatroom']['getChatrooms']['chatrooms'][number]['authors'];
    helperText?: React.ReactNode;
    selected?: boolean;
}) => {
    const readAllMessages = api.messaging.readAllMessages.useMutation();
    const {getUserPrescence, getFullName} = useApiTransformUtils();
    const name = authors
        ?.map((author) =>
            getFullName({
                firstName: author?.first_name,
                lastName: author?.last_name,
                fallback: 'Untitled',
            })
        )
        .filter(notEmpty)
        .join(', ');
    const isUserOnline = authors.some((author) =>
        getUserPrescence(author.user_id)
    );
    return (
        <div
            onClick={() => {
                if (hasUnreadMessages) {
                    readAllMessages.mutate({chatroomId});
                }
            }}
            className={cn(
                'flex w-full cursor-pointer items-center justify-between rounded-sm py-1 px-2 hover:bg-slate-700',
                {
                    'bg-slate-500 hover:bg-slate-500': selected,
                }
            )}
        >
            <div className="flex items-center overflow-visible">
                <Avatar size="sm">
                    <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn"/>
                    <AvatarFallback>CN</AvatarFallback>
                    <AvatarBadge position="bottomRight">
                        <div
                            className={cn('h-2 w-2 rounded-full ', {
                                'bg-green-500': isUserOnline,
                                'border border-white': !isUserOnline,
                            })}
                        />
                    </AvatarBadge>
                </Avatar>

                <p
                    className={cn(
                        'select-none overflow-hidden overflow-ellipsis whitespace-nowrap pl-3 text-detail text-slate-400',
                        {
                            'text-white': selected,
                        }
                    )}
                >
                    {name}
                </p>
            </div>
            <p
                className={cn('text-warm-gray-400 select-none text-detail ', {
                    'text-white': selected,
                })}
            >
                {helperText}
            </p>
        </div>
    );
};

export default ThreadListItem;
