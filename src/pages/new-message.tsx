import React from "react";
import { cn } from "@/utils/utils";
import ChatSidebar from "@/components/templates/root/ChatSidebar/ChatSidebar";
import { type NextPageWithLayout } from "@/pages/_app";
import { MainChatWrapper } from "@/pages/[chatroomId]";
import { Controller, FormProvider, useForm } from "react-hook-form";
import TextEditor from "@/components/modules/TextEditor/TextEditor";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import AuthorsAutocomplete from "@/components/templates/new-message/AuthorsAutocomplete";
import { api } from "@/utils/api";
import { useRouter } from "next/router";
import ScrollArea from "@/components/elements/ScrollArea";

const NewMessage: NextPageWithLayout = () => {
  const newMessageForm = useForm({
    resolver: zodResolver(
      z.object({
        authorId: z.number().min(1),
        text: z.string().min(1),
        content: z.any(),
      })
    ),
    defaultValues: {
      authorId: NaN,
      text: "",
      content: "",
    },
  });
  const router = useRouter();

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
        <div
          className="flex w-full flex-[0_0_60px] items-center border-b-2 border-black px-6"
        >
          <p className="font-semibold">New message</p>
        </div>
        <div
          className="flex w-full flex-[0_0_60px] items-center items-center border-b-2 border-black px-6"
        >
          <div className="flex w-full items-center space-x-2">
            <p className="leading-[0px]">To:</p>
            <AuthorsAutocomplete />
          </div>
        </div>
        <ScrollArea
          componentProps={{
            root: {
              className:
                "flex overflow-hidden h-full w-full rounded-xl bg-base-100",
            },
            viewport: {
              // ref: scrollAreaRef,
              className: "h-full w-full",
            },
          }}
        ></ScrollArea>
        <form
          id="message-text-input-form"
          className="flex w-full items-center justify-between space-x-4 bg-transparent bg-secondary px-6 py-3"
          onSubmit={newMessageForm.handleSubmit((data) => {
            console.log(data, "DATA");
          })}
          // onSubmit={chatForm.handleSubmit((data) => {
          //   sendMessage.mutate({
          //     ...data,
          //     chatroomId,
          //   });
          // })}
        >
          <Controller
            control={newMessageForm.control}
            render={({ field: { onChange, value } }) => {
              return (
                <TextEditor
                  onClickEnter={() => {
                    newMessageForm.handleSubmit((data) => {
                      console.log(JSON.stringify(data.content));
                      startNewChat.mutate({
                        authorId: data.authorId,
                        text: data.text,
                        content: JSON.stringify(data.content),
                      });
                    })();
                  }}
                  onChange={onChange}
                  content={value}
                />
              );
            }}
            name="content"
          />
        </form>
      </FormProvider>
    </>
  );
};

NewMessage.getLayout = function getLayout(page) {
  return (
    <div
      className={cn(
        "flex h-screen w-screen flex-row items-center justify-center  bg-warm-gray-50"
      )}
    >
      <div className={cn("flex h-full w-full flex-row")}>
        <ChatSidebar />
        <MainChatWrapper>{page}</MainChatWrapper>
      </div>
    </div>
  );
};

export default NewMessage;
