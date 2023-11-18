import {type NextPageWithLayout} from '@/pages/_app';
import React, {useEffect} from 'react';
import {useRouter} from 'next/router';
import ChatWindow, {useChatroomState,} from '@/pages/[chatroomId]/_components/main/main-content/ChatWindow';
import SendMessagebar from '@/pages/[chatroomId]/_components/main/SendMessagebar';
import {ChatNameBar} from '@/pages/[chatroomId]/_components/main/top-controls/actions';
import MainChatLayout from '@/pages/[chatroomId]/_components/MainChatLayout';
import {RoomProvider} from '../../../liveblocks.config';
import SendMessagebarProvider from '@/pages/[chatroomId]/_components/main/SendMessagebar/SendMessagebarProvider';
import ErrorBoundaryWithQueryReset from '@/components/ErrorBoundaryWithQueryReset';
import {cn} from '@/lib/utils';
import {Avatar, AvatarFallback} from '@/components/Avatar';
import dayjs from 'dayjs';
import {Button} from '@/components/Button';
import {useErrorBoundary} from 'react-error-boundary';
import {useQueryClient} from '@tanstack/react-query';

const ChatWindowErrorFallback = ({
                                     resetErrorBoundary,
                                 }: {
    resetErrorBoundary: () => void;
}) => {
    const errorBoundaryUtils = useErrorBoundary();
    const queryClient = useQueryClient();
    const router = useRouter();

    useEffect(() => {
        const handler = () => {
            errorBoundaryUtils.resetBoundary();
            queryClient.resetQueries({
                predicate: (query) => !!query.state.error,
            });
        };
        router.events.on('routeChangeStart', handler);
        return () => {
            router.events.off('routeChangeStart', handler);
        };
    }, []);

    return (
        <div className="flex h-full w-full flex-col space-y-7">
            <div className="h-12 w-full border-b border-slate-300 bg-white"/>
            <div className="flex-[1_1_0px]"/>
            <div
                className={cn(
                    'group relative flex flex-col justify-start  py-2 px-6 hover:bg-slate-50'
                )}
            >
                <div className="relative flex space-x-3">
                    <Avatar size="lg">
                        <AvatarFallback>UC</AvatarFallback>
                    </Avatar>
                    <div className="flex w-full flex-col space-y-2">
                        <div className="flex items-center space-x-2 text-sm font-semibold">
                            <p className="text-p font-semibold text-slate-700">
                                Unhinged Chat app
                            </p>
                            <div className="text-xs font-normal text-slate-400">
                                {dayjs.utc().local().format('hh:mm a')}
                            </div>
                        </div>
                        <div className="relative flex flex-col space-y-4">
                            <p className="text-small">
                                Yeeeett! Looks like I didn't understand the assignment.
                                Something went wrong or the conversation could not be found!
                            </p>
                            <Button
                                onClick={() => {
                                    resetErrorBoundary();
                                }}
                                size="sm"
                                className="w-max"
                            >
                                Click here to clapback
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="px-6 pb-6">
                <div className=" h-24 w-full rounded-md border border-slate-300 bg-slate-200"/>
            </div>
        </div>
    );
};

const ChatroomId: NextPageWithLayout = () => {
    const router = useRouter();
    const chatroomId =
        typeof router.query.chatroomId === 'string'
            ? router.query.chatroomId
            : undefined;

    const chatroomState = useChatroomState((state) => ({
        chatroomSyncRef: state.syncMessagesRef,
        sentNewMessage: state.sentNewMessage,
        setSentNewMessage: state.setSentNewMessage,
        receivedNewMessage: state.receivedNewMessage,
        setReceivedNewMessage: state.setReceivedNewMessage,
        newMessageScrollDirection: state.newMessageScrollDirection,
        setNewMessageScrollDirection: state.setNewMessageScrollDirection,
    }));

    if (!chatroomId) {
        return null;
    }

    return (
        <RoomProvider id={chatroomId} initialPresence={{}}>
            <div className="flex h-full w-full flex-col">
                <ErrorBoundaryWithQueryReset
                    fallbackRender={(props) => {
                        return (
                            <ChatWindowErrorFallback
                                resetErrorBoundary={props.resetErrorBoundary}
                            />
                        );
                    }}
                >
                    <ChatNameBar chatroomId={chatroomId}/>
                    <ChatWindow chatroomId={chatroomId} chatroomState={chatroomState}/>
                    <SendMessagebarProvider>
                        <SendMessagebar chatroomId={chatroomId}/>
                    </SendMessagebarProvider>
                </ErrorBoundaryWithQueryReset>
            </div>
        </RoomProvider>
    );
};

ChatroomId.getLayout = function getLayout(page) {
    return <MainChatLayout>{page}</MainChatLayout>;
};

export default ChatroomId;
