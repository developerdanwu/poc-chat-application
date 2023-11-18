import {api} from '@/lib/api';
import {cn, useApiTransformUtils} from '@/lib/utils';
import {notEmpty} from '@/lib/ts-utils';
import React from 'react';
import {Avatar, AvatarBadge, AvatarFallback, AvatarImage,} from '@/components/Avatar';
import {useChatroomState} from '@/pages/[chatroomId]/_components/main/main-content/ChatWindow';
import {AiOutlineSync} from 'react-icons/ai';

export const ChatNameBar = ({chatroomId}: { chatroomId: string }) => {
    const chatroomDetail = api.chatroom.getChatroom.useQuery({
        chatroomId: chatroomId,
    });
    const chatroomQueryState = api.chatroom.getChatroom.useQuery({
        chatroomId,
    });
    const messagesQueryState = api.messaging.getMessages.useInfiniteQuery({
        chatroomId: chatroomId,
    });
    const messageCountQueryState = api.messaging.getMessagesCount.useQuery({
        chatroomId,
    });
    const chatroomState = useChatroomState((state) => ({
        chatroomSyncRef: state.syncMessagesRef,
    }));

    const {filterAuthedUserFromChatroomAuthors, getFullName, getUserPrescence} =
        useApiTransformUtils();
    const filteredChatroomUsers = filterAuthedUserFromChatroomAuthors(
        chatroomDetail.data?.authors ?? []
    );
    const isUserOnline = filteredChatroomUsers.some((author) =>
        getUserPrescence(author.user_id)
    );

    if (!chatroomDetail.data) {
        return null;
    }

    return (
        <div
            className="flex w-full flex-[0_0_48px] items-center justify-start space-x-2 border-b border-slate-300 px-6">
            {filteredChatroomUsers && filteredChatroomUsers.length === 1 ? (
                filteredChatroomUsers.map((author) => {
                    const fullName = getFullName({
                        firstName: author.first_name,
                        lastName: author.last_name,
                        fallback: 'Untitled',
                    });
                    return (
                        <div
                            key={author.author_id}
                            className="relative flex items-center space-x-2"
                        >
                            <Avatar>
                                <AvatarImage
                                    src="https://github.com/shadcn.png"
                                    alt="@shadcn"
                                />
                                <AvatarFallback>CN</AvatarFallback>
                                <AvatarBadge position="bottomRight">
                                    <div
                                        className={cn('h-3 w-3 rounded-full ', {
                                            'bg-green-500': isUserOnline,
                                            'border-2 border-slate-900 bg-white': !isUserOnline,
                                        })}
                                    />
                                </AvatarBadge>
                            </Avatar>
                            <p className="text-lg font-semibold text-slate-900">{fullName}</p>
                        </div>
                    );
                })
            ) : (
                <p className=" px-6 text-lg font-semibold text-slate-900">
                    {filteredChatroomUsers
                        ?.map((author) =>
                            getFullName({
                                firstName: author.first_name,
                                lastName: author.last_name,
                                fallback: 'Untitled',
                            })
                        )
                        .filter(notEmpty)
                        .join(',')}
                </p>
            )}
            {chatroomQueryState.isFetching ||
            messagesQueryState.isFetching ||
            messageCountQueryState.isFetching ? (
                <div>
                    <AiOutlineSync className="animate-spin"/>
                </div>
            ) : null}
            <div ref={chatroomState.chatroomSyncRef}/>
        </div>
    );
};
