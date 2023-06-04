import React, { useRef } from 'react';
import { cn, useApiTransformUtils } from '@/lib/utils';
import ChatSidebar from '@/components/templates/root/ChatSidebar/ChatSidebar';
import { type NextPageWithLayout } from '@/pages/_app';
import { MainChatWrapper } from '@/pages/[chatroomId]';
import { Controller, FormProvider, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import z from 'zod';
import AuthorsAutocomplete from '@/components/templates/new-message/AuthorsAutocomplete';
import { api } from '@/lib/api';
import { useRouter } from 'next/router';
import HookFormTiptapEditor from '@/components/modules/TextEditor/HookFormTiptapEditor';
import { EditorContent } from '@tiptap/react';
import EditorMenuBar from '@/components/modules/TextEditor/EditorMenuBar';
import ChatWindow, {
  type ChatWindowRef,
} from '@/components/templates/root/ChatWindow/ChatWindow';
import ScrollArea from '@/components/elements/ScrollArea';
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupList,
  AvatarImage,
  AvatarOverflowIndicator,
} from '@/components/elements/avatar';

const StartOfGroupChat = ({
  authors,
}: {
  authors: NewMessageSchema['authors'];
}) => {
  const { getFullName } = useApiTransformUtils();
  return (
    <div className="flex flex-col px-6 pt-10">
      <div className="relative flex items-center space-x-2">
        <AvatarGroup limit={3}>
          <AvatarGroupList>
            {authors.map((author) => (
              <Avatar
                key={author.author_id}
                className=" h-20 w-20 border border-slate-300"
                size="lg"
              >
                <AvatarImage
                  src="https://github.com/shadcn.png"
                  alt="@shadcn"
                />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
            ))}
          </AvatarGroupList>
          <AvatarOverflowIndicator />
        </AvatarGroup>
      </div>
      <p className="pt-5 pb-2 text-xl font-bold">
        {authors
          .map((author) =>
            getFullName({
              firstName: author?.first_name,
              lastName: author?.last_name,
              fallback: 'Untitled',
            })
          )
          .join(', ')}
      </p>
      <p className="text-warm-gray-400 text-sm">
        This is the beginning of your message history with{' '}
        <span className="font-semibold">
          {authors
            .map((author) =>
              getFullName({
                firstName: author.first_name,
                lastName: author.last_name,
                fallback: 'Untitled',
              })
            )
            .join(', ')}
        </span>
      </p>
    </div>
  );
};

const newMessageSchema = z.object({
  authors: z.array(
    z.object({
      author_id: z.number(),
      first_name: z.string(),
      last_name: z.string(),
    })
  ),
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
  const guessChatroomFromAuthors =
    api.messaging.guessChatroomFromAuthors.useQuery({
      authors: watchedAuthors,
    });
  console.log('DATA', watchedAuthors);
  const { getFullName } = useApiTransformUtils();
  const startNewChat = api.messaging.startNewChat.useMutation({
    onMutate: () => {
      newMessageForm.reset();
    },
    onSuccess: (data) => {
      return router.push(`/${data.id}`);

      // trpcUtils.messaging.getMessages.reset();
      // trpcUtils.messaging.getMessages.setInfiniteData(
      //   { chatroomId: data.chatroomId },
      //   (old) => {
      //     if (!old) {
      //       return {
      //         pages: [
      //           {
      //             messages: [data],
      //             nextCursor: undefined,
      //           },
      //         ],
      //         pageParams: [],
      //       };
      //     }
      //     if (old.pages.length === 0) {
      //       return {
      //         pages: [
      //           {
      //             messages: [data],
      //             nextCursor: undefined,
      //           },
      //         ],
      //         pageParams: [],
      //       };
      //     }
      //
      //     const newState = produce(old.pages, (draft) => {
      //       draft[0]?.messages.unshift(data);
      //     });
      //
      //     return {
      //       pages: newState,
      //       pageParams: old.pageParams,
      //     };
      //   }
      // );
      // router.push(`/${data.chatroomId}`);
    },
  });

  return (
    <>
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
          <div className="flex h-full w-full flex-col">
            <div className="h-full" />
            <ScrollArea
              componentProps={{
                root: {
                  className: 'h-auto w-full rounded-xl bg-base-100',
                },
              }}
            >
              {watchedAuthors?.length === 1 ? (
                <div className="flex flex-col px-6 pt-10">
                  <Avatar className="h-20 w-20" size="lg">
                    <AvatarImage
                      src="https://github.com/shadcn.png"
                      alt="@shadcn"
                    />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                  <p className="pt-5 pb-2 text-xl font-bold">
                    {getFullName({
                      firstName: watchedAuthors[0]?.first_name,
                      lastName: watchedAuthors[0]?.last_name,
                      fallback: 'Untitled',
                    })}
                  </p>
                  <p className="text-warm-gray-400 text-sm">
                    This is the beginning of your message history with{' '}
                    <span className="font-semibold">
                      {getFullName({
                        firstName: watchedAuthors[0]?.first_name,
                        lastName: watchedAuthors[0]?.last_name,
                        fallback: 'Untitled',
                      })}
                    </span>
                  </p>
                </div>
              ) : null}
              {watchedAuthors?.length > 1 ? (
                <StartOfGroupChat authors={watchedAuthors} />
              ) : null}
            </ScrollArea>
          </div>
        )}
        <form
          id="message-text-input-form"
          className="flex w-full items-center justify-between space-x-4 bg-transparent bg-secondary px-6 py-3"
          onSubmit={newMessageForm.handleSubmit((data) => {
            startNewChat.mutate({
              authorId: data.authorId,
              text: data.text,
              content: JSON.stringify(data.content),
            });
          })}
        >
          <HookFormTiptapEditor
            editorProps={{
              attributes: {
                class: cn('border-0 max-h-[55vh] overflow-auto w-full py-3'),
              },
            }}
            // extensions={[SubmitFormOnEnter]}
            fieldName="content"
          >
            {(editor) => {
              return (
                <div
                  className={cn(
                    'border-warm-gray-400  group w-full rounded-lg border border-slate-300 px-3 py-3',
                    {
                      'border-slate-400': editor.isFocused,
                    }
                  )}
                >
                  <EditorMenuBar editor={editor} />
                  <EditorContent editor={editor} />
                </div>
              );
            }}
          </HookFormTiptapEditor>
        </form>
      </FormProvider>
    </>
  );
};

NewMessage.getLayout = function getLayout(page) {
  return (
    <div
      className={cn(
        'bg-warm-gray-50 flex h-screen w-screen flex-row items-center  justify-center'
      )}
    >
      <div className={cn('flex h-full w-full flex-row')}>
        <ChatSidebar />
        <MainChatWrapper>{page}</MainChatWrapper>
      </div>
    </div>
  );
};

export default NewMessage;
