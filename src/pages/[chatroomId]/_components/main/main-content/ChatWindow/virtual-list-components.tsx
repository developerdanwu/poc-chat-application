import React from 'react';
import {type ScrollerProps, type TopItemListProps} from 'react-virtuoso';
import {motion} from 'framer-motion';
import StartOfDirectMessage from '@/pages/[chatroomId]/_components/main/main-content/ChatWindow/StartOfDirectMessage';
import {Skeleton} from '@/components/Skeleton';
import {cn} from '@/lib/utils';
import {type ChatWindowVirtualListContext} from '@/pages/[chatroomId]/_components/main/main-content/ChatWindow/index';

export const ChatItemSkeleton = ({
                                     variant = 'one',
                                 }: {
    variant?: 'one' | 'two' | 'three' | 'four';
}) => {
    return (
        <div className="flex space-x-3 py-2 px-6">
            <Skeleton className={cn('h-10 w-10 flex-shrink-0 rounded-full')}/>
            <div className="mt-2 flex flex-shrink  flex-col space-y-3">
                <div className="flex space-x-1">
                    <Skeleton className={cn(' h-2 w-20 rounded-full')}/>
                    <Skeleton className={cn('h-2 w-12 rounded-full')}/>
                </div>
                <Skeleton
                    className={cn('flex-shrink ', {
                        'h-2 w-72 rounded-full': variant === 'one',
                        'h-2 w-52 rounded-full': variant === 'two',
                        'h-2 w-16 rounded-full': variant === 'three',
                        'h-52 w-72': variant === 'four',
                    })}
                />
            </div>
        </div>
    );
};
export const TopItemList = ({
                                children,
                                style,
                                context,
                            }: TopItemListProps & {
    context?: ChatWindowVirtualListContext;
}) => {
    if (context?.unreadCount && context.unreadCount > 0) {
        return (
            <div style={{...style, position: 'absolute'}} className="static ">
                {children}
            </div>
        );
    }
    return <div style={style}>{children}</div>;
};
export const ChatHeader = ({
                               context,
                           }: {
    context?: ChatWindowVirtualListContext;
}) => {
    if (!context?.filteredChatroomUsers || context?.hasNextPage) {
        return (
            <>
                {Array(10)
                    .fill(true)
                    .map((_, index) => {
                        if (index % 4 === 0) {
                            return <ChatItemSkeleton key={index} variant="four"/>;
                        }
                        if (index % 3 === 0) {
                            return <ChatItemSkeleton key={index} variant="three"/>;
                        }
                        if (index % 2 === 0) {
                            return <ChatItemSkeleton key={index} variant="two"/>;
                        }
                        return <ChatItemSkeleton key={index} variant="one"/>;
                    })}
            </>
        );
    }

    return <StartOfDirectMessage authors={context.filteredChatroomUsers}/>;
};
export const ChatScroller = React.forwardRef<
    HTMLDivElement,
    ScrollerProps & {
    context?: ChatWindowVirtualListContext;
}
>(({style, ...props}, ref) => {
    return (
        <motion.div
            ref={ref}
            style={{
                ...style,
                y: props.context?.topHeight,
            }}
            {...props}
        />
    );
});

ChatScroller.displayName = 'ChatScroller';
