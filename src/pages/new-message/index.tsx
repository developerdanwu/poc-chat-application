import React, { useRef } from 'react';
import { type NextPageWithLayout } from '@/pages/_app';
import { Controller, FormProvider, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import z from 'zod';
import AuthorsAutocomplete from '@/pages/[chatroomId]/_components/main/top-controls/AuthorsAutocomplete';
import { api } from '@/lib/api';
import { useRouter } from 'next/router';
import ChatWindow, {
  type ChatWindowRef,
} from '@/pages/[chatroomId]/_components/main/main-content/ChatWindow';
import ScrollArea from '@/components/elements/ScrollArea';
import StartOfDirectMessage from '@/pages/[chatroomId]/_components/main/main-content/ChatWindow/StartOfDirectMessage';
import { Role } from '@prisma-generated/generated/types';
import MainChatLayout from '@/pages/[chatroomId]/_components/MainChatLayout';
import { v4 as uuid } from 'uuid';
import SendMessageTextEditor from '@/pages/[chatroomId]/_components/main/SendMessagebar/SendMessageTextEditor';
import { RoomProvider } from '../../../liveblocks.config';
import SendMessagebarProvider from '@/pages/[chatroomId]/_components/main/SendMessagebar/SendMessagebarProvider';
import { getAuthorsTypingTranslation } from '@/pages/[chatroomId]/_components/main/SendMessagebar';
import { useAblyStore } from '@/lib/ably';
import { type RouterOutput } from '@/server/api/root';

const newMessageSchema = z.object({
  authors: z
    .array(
      z.object({
        author_id: z.number(),
        first_name: z.string(),
        last_name: z.string(),
        role: z.union([z.literal(Role.AI), z.literal(Role.USER)]),
      })
    )
    .min(1),
  text: z.string().min(1),
  content: z.any(),
});

type NewMessageSchema = z.infer<typeof newMessageSchema>;

const NewMessage: NextPageWithLayout = () => {
  const newMessageForm = useForm<NewMessageSchema>({
    resolver: zodResolver(newMessageSchema),
    defaultValues: {
      authors: [],
      text: '',
      content: '',
    },
  });
  const watchedAuthors = useWatch({
    control: newMessageForm.control,
    name: 'authors',
  });
  const router = useRouter();
  const chatWindowRef = useRef<ChatWindowRef>(null);
  const chatFormRef = useRef<HTMLFormElement>(null);
  const guessChatroomFromAuthors =
    api.chatroom.guessChatroomFromAuthors.useQuery(
      {
        authors: watchedAuthors,
      },
      {
        keepPreviousData: true,
      }
    );
  const ablyStore = useAblyStore((state) => ({
    typing: state.typing,
  }));
  const authorsInConversation =
    ablyStore.typing[guessChatroomFromAuthors.data?.id || ''] || undefined;
  const uniqueSortedAuthorsInConversation = [
    ...new Set(authorsInConversation),
  ].sort((a, b) => a - b);
  const authorsHashmap = guessChatroomFromAuthors.data?.authors.reduce<
    Record<string, RouterOutput['chatroom']['getChatroom']['authors'][number]>
  >((prevVal, author) => {
    prevVal[author.author_id] = author;
    return prevVal;
  }, {});
  const trpcUtils = api.useContext();
  const startNewChat = api.chatroom.startNewChat.useMutation({
    onMutate: () => {
      newMessageForm.reset();
    },
    onSuccess: (data) => {
      trpcUtils.messaging.getMessages.invalidate({
        chatroomId: data.id,
      });
      trpcUtils.chatroom.getAllHumanAuthors.invalidate();
      trpcUtils.chatroom.getChatrooms.invalidate();
      return router.push(`/${data.id}`);
    },
  });

  return (
    <div className="flex h-full w-full flex-col">
      <FormProvider {...newMessageForm}>
        <div className="flex w-full flex-[0_0_48px] items-center border-b border-slate-300 px-6">
          <p className="font-semibold">New message</p>
        </div>
        <div className="flex w-full flex-[0_0_48px] items-center border-b border-slate-300 px-6">
          <div className="flex w-full items-center space-x-2">
            <p className="leading-[0px]">To:</p>
            <Controller
              control={newMessageForm.control}
              render={({ field: { value, onChange } }) => {
                return (
                  <AuthorsAutocomplete
                    value={value}
                    onChange={(newSelection) => onChange(newSelection)}
                  />
                );
              }}
              name="authors"
            />
          </div>
        </div>
        {guessChatroomFromAuthors.data?.id ? (
          <ChatWindow
            ref={chatWindowRef}
            chatroomId={guessChatroomFromAuthors.data.id}
          />
        ) : (
          <div className="flex w-full flex-[1_1_0px] flex-col">
            <div className="flex-[1_1_0px]" />
            <ScrollArea
              slotProps={{
                root: {
                  className: 'h-auto w-full rounded-xl bg-base-100',
                },
              }}
            >
              {watchedAuthors?.length > 0 ? (
                <StartOfDirectMessage authors={watchedAuthors} />
              ) : null}
            </ScrollArea>
          </div>
        )}
        <RoomProvider
          id={guessChatroomFromAuthors.data?.id || 'new-message'}
          initialPresence={{}}
        >
          <SendMessagebarProvider>
            <FormProvider {...newMessageForm}>
              <form
                ref={chatFormRef}
                id="message-text-input-form"
                className="h-auto min-h-fit flex-shrink-0 overflow-hidden"
                onSubmit={newMessageForm.handleSubmit((data) => {
                  startNewChat.mutate({
                    message_checksum: uuid(),
                    authors: data.authors,
                    text: data.text,
                    content: JSON.stringify(data.content),
                  });
                })}
              >
                <div className="flex flex-col px-6 ">
                  <SendMessageTextEditor
                    chatroomId={guessChatroomFromAuthors.data?.id}
                    chatroomAuthors={guessChatroomFromAuthors.data?.authors}
                    chatFormRef={chatFormRef}
                  />
                  <p className="h-6 text-detail text-slate-500">
                    {authorsHashmap
                      ? getAuthorsTypingTranslation(
                          uniqueSortedAuthorsInConversation,
                          authorsHashmap
                        )
                      : null}
                  </p>
                </div>
              </form>
            </FormProvider>
          </SendMessagebarProvider>
        </RoomProvider>
      </FormProvider>
    </div>
  );
};

NewMessage.getLayout = function getLayout(page) {
  return <MainChatLayout>{page}</MainChatLayout>;
};

export default NewMessage;
