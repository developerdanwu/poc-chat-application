import React, { useEffect, useRef, useState } from 'react';
import { cn, safeJSONParse, useApiTransformUtils } from '@/lib/utils';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/elements/avatar';
import dayjs from 'dayjs';
import { type Author } from '@prisma-generated/generated/types';
import BaseRichTextEditor from '@/components/modules/rich-text/BaseRichTextEditor';
import { type RouterOutput } from '@/server/api/root';
import { type useChatroomMessages } from '@/pages/[chatroomId]/_components/main/main-content/ChatWindow/hooks';
import { type useUser } from '@clerk/nextjs';
import { useChatroomState } from '@/pages/[chatroomId]/_components/main/main-content/ChatWindow/index';

const EditableWrapper = ({
  children,
}: {
  children: (props: {
    isEditing: boolean;
    setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
  }) => React.ReactNode;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  return <>{children({ isEditing, setIsEditing })}</>;
};

const ChatReplyAvatar = ({
  differenceBetweenLastMessage,
  firstName,
  lastName,
  sendDate,
  isLastMessageSenderEqualToCurrentMessageSender,
}: {
  sendDate: Date;
  firstName: string;
  lastName: string;
  differenceBetweenLastMessage: number | undefined;
  isLastMessageSenderEqualToCurrentMessageSender: boolean;
}) => {
  const { getFullName } = useApiTransformUtils();
  const fullName = getFullName({
    firstName: firstName,
    lastName: lastName,
    fallback: 'Untitled',
  });

  if (
    !isLastMessageSenderEqualToCurrentMessageSender ||
    differenceBetweenLastMessage === undefined ||
    differenceBetweenLastMessage > 5
  ) {
    return (
      <Avatar size="lg">
        <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
        <AvatarFallback>{fullName}</AvatarFallback>
      </Avatar>
    );
  }

  return (
    <div className="invisible w-10 pt-[2px] text-xs font-normal text-slate-400 group-hover:visible">
      {dayjs.utc(sendDate).local().format('hh:mm')}
    </div>
  );
};
export const ChatReplyItemWrapper = ({
  chatroomId,
  virtualListWrapperRef,
  isFirstOfNewGroup,
  isFirstUnreadMessage,
  isLastMessageSenderEqualToCurrentMessageSender,
  sendDate,
  differenceBetweenLastMessage,
  children,
  communicator,
  author,
}: {
  chatroomId: string;
  virtualListWrapperRef: React.RefObject<HTMLDivElement>;
  isFirstOfNewGroup: boolean;
  isFirstUnreadMessage: boolean;
  isLastMessageSenderEqualToCurrentMessageSender: boolean;
  differenceBetweenLastMessage: number | undefined;
  sendDate: Date;
  author: Pick<Author, 'first_name' | 'last_name'>;
  children: React.ReactNode;
  communicator: 'sender' | 'receiver';
}) => {
  const { setNewMessageScrollDirection } = useChatroomState((state) => ({
    setNewMessageScrollDirection: state.setNewMessageScrollDirection,
  }));
  const intersectingRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (isFirstUnreadMessage && entry?.isIntersecting) {
          setNewMessageScrollDirection(chatroomId, 'in-view');

          return;
        }

        if (isFirstUnreadMessage && !entry?.isIntersecting) {
          if (
            entry?.boundingClientRect.top &&
            entry.boundingClientRect.top > 0
          ) {
            setNewMessageScrollDirection(chatroomId, 'down');
            console.log('BELOW'); // do things if below
          } else {
            setNewMessageScrollDirection(chatroomId, 'up');
            console.log('ABOVE'); // do things if above
          }
          // console.log(originalIndex, entry.isIntersecting);
        }
      },
      {
        root: virtualListWrapperRef.current,
      }
    );
    if (intersectingRef.current) {
      observer.observe(intersectingRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [chatroomId, isFirstUnreadMessage]);

  return (
    <div
      ref={intersectingRef}
      data-communicator={communicator}
      className={cn(
        'group relative flex flex-col justify-start  py-2 px-6 hover:bg-slate-50'
      )}
    >
      {isFirstUnreadMessage ? (
        <div
          className={cn(
            'absolute left-1/2 -top-[10px] flex w-full -translate-x-1/2 items-center space-x-3',
            {
              '-top-7': isFirstOfNewGroup,
            }
          )}
        >
          <div className="flex-grow border-t border-red-500  outline-1" />
          <p className="pr-2 text-detail text-red-500">New</p>
        </div>
      ) : null}
      {!isFirstUnreadMessage && isFirstOfNewGroup ? (
        <div className={cn('absolute -top-5 left-1/2 w-full -translate-x-1/2')}>
          <div className="flex-grow border-t border-slate-300" />
        </div>
      ) : null}
      <div className="relative flex space-x-3">
        <ChatReplyAvatar
          isLastMessageSenderEqualToCurrentMessageSender={
            isLastMessageSenderEqualToCurrentMessageSender
          }
          sendDate={sendDate}
          differenceBetweenLastMessage={differenceBetweenLastMessage}
          lastName={author.last_name}
          firstName={author.first_name}
        />
        {children}
      </div>
    </div>
  );
};

const ChatReplyItemHeader = ({
  isLastMessageSenderEqualToCurrentMessageSender,
  differenceBetweenLastMessage,
  firstName,
  lastName,
  sendDate,
}: {
  isLastMessageSenderEqualToCurrentMessageSender: boolean;
  sendDate: Date;
  firstName: string;
  lastName: string;
  differenceBetweenLastMessage: number | undefined;
}) => {
  const { getFullName } = useApiTransformUtils();
  const fullName = getFullName({
    firstName: firstName,
    lastName: lastName,
    fallback: 'Untitled',
  });

  if (
    !isLastMessageSenderEqualToCurrentMessageSender ||
    differenceBetweenLastMessage === undefined ||
    differenceBetweenLastMessage > 5
  ) {
    return (
      <div className="flex items-center space-x-2 text-sm font-semibold">
        <p className="text-p font-semibold text-slate-700">{fullName}</p>
        <div className="text-xs font-normal text-slate-400">
          {dayjs.utc(sendDate).local().format('hh:mm a')}
        </div>
      </div>
    );
  }

  return null;
};
export const ChatReplyItem = ({
  isLastMessageSenderEqualToCurrentMessageSender,
  differenceBetweenLastMessage,
  author,
  sendDate,
  content,
}: {
  isLastMessageSenderEqualToCurrentMessageSender: boolean;
  differenceBetweenLastMessage: number | undefined;
  content: string;
  author: Pick<Author, 'first_name' | 'last_name'>;
  sendDate: Date;
}) => {
  return (
    <div className="flex w-full flex-col space-y-2">
      <ChatReplyItemHeader
        isLastMessageSenderEqualToCurrentMessageSender={
          isLastMessageSenderEqualToCurrentMessageSender
        }
        sendDate={sendDate}
        differenceBetweenLastMessage={differenceBetweenLastMessage}
        lastName={author.last_name}
        firstName={author.first_name}
      />

      <div className="relative flex flex-col space-y-2">
        <BaseRichTextEditor
          slotProps={{
            root: {
              initialValue: safeJSONParse(content),
            },
            editable: {
              readOnly: true,
            },
          }}
        />
      </div>
    </div>
  );
};

export const ChatWindowItem = React.memo(
  ({
    chatroomId,
    virtualListWrapperRef,
    isFirstOfNewGroup,
    isFirstUnreadMessage,
    authorsHashmap,
    message,
    user,
  }: {
    chatroomId: string;
    virtualListWrapperRef: React.RefObject<HTMLDivElement>;
    isFirstOfNewGroup: boolean;
    isFirstUnreadMessage: boolean;
    authorsHashmap: Record<
      string,
      RouterOutput['chatroom']['getChatroom']['authors'][number]
    >;
    message: NonNullable<
      ReturnType<typeof useChatroomMessages>['messages']
    >[number];
    user: ReturnType<typeof useUser>;
  }) => {
    const author = authorsHashmap[message.author_id];
    if (!author) {
      throw new Error('author not found');
    }
    const isSentByMe = author.user_id === user.user?.id;
    const previousMessage = message?.previousMessage;
    const previousMessageAuthor = previousMessage
      ? authorsHashmap[previousMessage.author_id]
      : undefined;

    // TODO: AVATAR PLACEMENT DUE TO TIME IS BUGGED??
    const differenceBetweenLastMessage = previousMessage
      ? dayjs
          .utc(message.created_at)
          .local()
          .diff(dayjs.utc(previousMessage.created_at).local(), 'minute')
      : undefined;

    const isLastMessageSenderEqualToCurrentMessageSender =
      previousMessageAuthor?.author_id === author.author_id;
    return (
      <ChatReplyItemWrapper
        chatroomId={chatroomId}
        virtualListWrapperRef={virtualListWrapperRef}
        isFirstOfNewGroup={isFirstOfNewGroup}
        isFirstUnreadMessage={isFirstUnreadMessage}
        isLastMessageSenderEqualToCurrentMessageSender={
          isLastMessageSenderEqualToCurrentMessageSender
        }
        sendDate={message.created_at}
        differenceBetweenLastMessage={differenceBetweenLastMessage}
        key={message.client_message_id}
        author={author}
        communicator={isSentByMe ? 'sender' : 'receiver'}
      >
        <ChatReplyItem
          key={message.text}
          isLastMessageSenderEqualToCurrentMessageSender={
            isLastMessageSenderEqualToCurrentMessageSender
          }
          differenceBetweenLastMessage={differenceBetweenLastMessage}
          sendDate={message.created_at}
          author={author}
          content={message.content}
        />
      </ChatReplyItemWrapper>
    );
  }
);

ChatWindowItem.displayName = 'ChatWindowItem';
