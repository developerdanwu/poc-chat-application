import { type NextPageWithLayout } from '@/pages/_app';
import { cn } from '@/utils/utils';
import ChatSidebar from '@/components/templates/root/ChatSidebar/ChatSidebar';
import React, { useRef } from 'react';
import { useRouter } from 'next/router';
import ChatWindow from '@/components/templates/root/ChatWindow/ChatWindow';
import { FormProvider, useForm } from 'react-hook-form';
import { api } from '@/utils/api';
import { zodResolver } from '@hookform/resolvers/zod';
import z from 'zod';
import { getQueryKey } from '@trpc/react-query';
import dayjs from 'dayjs';
import produce from 'immer';
import { type InfiniteData, useQueryClient } from '@tanstack/react-query';
import { type RouterOutput } from '@/server/api/root';
import { useUser } from '@clerk/nextjs';
import ChatTopControls from '@/components/templates/root/ChatTopControls';

export const MainChatWrapper = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center overflow-hidden bg-warm-gray-50 ">
      {children}
    </div>
  );
};

const chatFormSchema = z.object({
  text: z.string().min(1),
  content: z.any(),
});

export type ChatForm = z.infer<typeof chatFormSchema>;

const ChatroomId: NextPageWithLayout = () => {
  const router = useRouter();
  const chatroomId =
    typeof router.query.chatroomId === 'string' ? router.query.chatroomId : '';
  const trpcUtils = api.useContext();
  const queryClient = useQueryClient();
  const user = useUser();
  const sendMessage = api.messaging.sendMessage.useMutation({
    onSettled: () => {
      queryClient.invalidateQueries(
        getQueryKey(
          api.messaging.getMessages,
          {
            chatroomId,
          },
          'query'
        )
      );
    },
    onMutate: (variables) => {
      const oldData = trpcUtils.messaging.getMessages.getInfiniteData({
        chatroomId,
      });
      trpcUtils.messaging.getMessages.setInfiniteData({ chatroomId }, (old) => {
        if (!old) {
          return {
            pages: [{ messages: [], next_cursor: null }],
            pageParams: [],
          };
        }

        const newMessage = {
          client_message_id:
            old.pages[old.pages.length - 1]?.messages?.[
              (old.pages?.[old.pages.length - 1]?.messages?.length ?? 1) - 1
            ]?.client_message_id || 999,
          text: variables.text,
          content: variables.content,
          created_at: dayjs().utc().toISOString(),
          updated_at: dayjs().utc().toISOString(),
          author: {
            author_id: 999,
            user_id: user?.user?.id || '',
            first_name: user?.user?.firstName || '',
            last_name: user?.user?.lastName || '',
          },
        };

        if (old.pages.length === 0) {
          return {
            pages: [
              {
                messages: [newMessage],
                next_cursor: null,
              },
            ],
            pageParams: [],
          };
        }

        const newState = produce(old.pages, (draft) => {
          draft[0]?.messages.unshift(newMessage);
          return draft;
        });

        return {
          pages: newState || [],
          pageParams: old.pageParams,
        };
      });

      chatForm.reset();
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
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const chatForm = useForm({
    resolver: zodResolver(chatFormSchema),
    defaultValues: {
      text: '',
      content: '',
    },
  });

  return (
    <>
      {typeof router.query.chatroomId === 'string' && (
        <MainChatWrapper>
          <ChatTopControls chatroomId={chatroomId} />
          <FormProvider {...chatForm}>
            <ChatWindow chatroomId={router.query.chatroomId} />
          </FormProvider>
        </MainChatWrapper>
      )}
    </>
  );
};

ChatroomId.getLayout = function getLayout(page) {
  return (
    <div
      className={cn(
        'flex h-screen w-screen flex-row items-center justify-center  bg-warm-gray-50'
      )}
    >
      <div className={cn('flex h-full w-full flex-row')}>
        <ChatSidebar />
        <MainChatWrapper>{page}</MainChatWrapper>
      </div>
    </div>
  );
};

export default ChatroomId;
