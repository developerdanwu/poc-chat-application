import React, { useRef } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { api } from '@/lib/api';
import dayjs from 'dayjs';
import { type InfiniteData } from '@tanstack/react-query';
import { type RouterOutput } from '@/server/api/root';
import { zodResolver } from '@hookform/resolvers/zod';
import z from 'zod';
import { useChatroomState } from '@/pages/[chatroomId]/_components/main/main-content/ChatWindow';
import useChatroomUpdateUtils from '@/pages/[chatroomId]/_components/useChatroomUpdateUtils';
import { v4 as uuid } from 'uuid';
import { RoomProvider } from '../../../../../../liveblocks.config';
import SendMessageTextEditor from '@/pages/[chatroomId]/_components/main/SendMessagebar/SendMessageTextEditor';
import { useApiTransformUtils } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/elements/popover';
import PeekMessage from '@/pages/[chatroomId]/_components/main/SendMessagebar/PeekMessage';

const SendMessagebar = ({ chatroomId }: { chatroomId: string }) => {
  const chatroomUpdateUtils = useChatroomUpdateUtils();
  const chatroomState = useChatroomState((state) => ({
    setSentNewMessage: state.setSentNewMessage,
  }));
  const chatroomDetail = api.chatroom.getChatroom.useQuery({
    chatroomId: chatroomId,
  });
  const trpcUtils = api.useContext();
  const { filterAuthedUserFromChatroomAuthors } = useApiTransformUtils();
  const filteredChatroomUsers = filterAuthedUserFromChatroomAuthors(
    chatroomDetail.data?.authors ?? []
  );
  const ownAuthor = api.chatroom.getOwnAuthor.useQuery();
  const chatFormRef = useRef<HTMLFormElement>(null);
  const chatForm = useForm({
    resolver: zodResolver(
      z.object({
        text: z.string().min(1),
        content: z.any(),
      })
    ),
    defaultValues: {
      text: '',
      content: '',
    },
  });

  const sendMessage = api.messaging.sendMessage.useMutation({
    mutationKey: ['sendMessage', chatroomId],
    onMutate: (variables) => {
      const oldData = trpcUtils.messaging.getMessages.getInfiniteData({
        chatroomId,
      });

      const flatMapMessages = oldData?.pages.flatMap((page) => page.messages);

      if (flatMapMessages && ownAuthor.data) {
        chatroomUpdateUtils.updateMessages({
          chatroomId: variables.chatroomId,
          message: {
            message_checksum: variables.messageChecksum,
            client_message_id:
              flatMapMessages.length > 0
                ? flatMapMessages[0]!.client_message_id + 1
                : 1,
            text: variables.text,
            content: variables.content,
            is_edited: false,
            created_at: dayjs.utc().toDate(),
            updated_at: dayjs.utc().toDate(),
            author_id: ownAuthor.data.author_id,
          },
        });
      }

      chatForm.reset();
      chatroomState.setSentNewMessage(variables.chatroomId, true);
      return {
        oldData,
      };
    },
    onError: (error, variables, context) => {
      const contextCast = context as {
        oldData?: InfiniteData<RouterOutput['messaging']['getMessages']>;
      };
      if (contextCast.oldData) {
        trpcUtils.messaging.getMessages.setInfiniteData(
          { chatroomId },
          () => contextCast.oldData
        );
      }
    },
  });

  if (!ownAuthor.data) {
    return null;
  }

  return (
    <FormProvider {...chatForm}>
      <form
        ref={chatFormRef}
        id="message-text-input-form"
        className="h-auto min-h-fit overflow-hidden"
        onSubmit={chatForm.handleSubmit((data) => {
          sendMessage.mutate({
            ...data,
            content: JSON.stringify(data.content),
            chatroomId,
            messageChecksum: uuid(),
          });
        })}
      >
        <div className="flex flex-col  px-6 pb-6">
          <RoomProvider
            id={`${chatroomId}-${ownAuthor.data.user_id}`}
            initialPresence={{}}
          >
            <SendMessageTextEditor chatFormRef={chatFormRef} />
          </RoomProvider>
          <Popover>
            <PopoverTrigger className="w-min">
              <p className="w-max self-start text-left">Dan is typing...</p>
            </PopoverTrigger>
            <PopoverContent align="start">
              {filteredChatroomUsers?.map((author) => {
                return (
                  <RoomProvider
                    key={author.user_id}
                    id={`${chatroomId}-${author.user_id}`}
                    initialPresence={{}}
                  >
                    <PeekMessage />
                  </RoomProvider>
                );
              })}
            </PopoverContent>
          </Popover>
        </div>
      </form>
    </FormProvider>
  );
};

export default SendMessagebar;
