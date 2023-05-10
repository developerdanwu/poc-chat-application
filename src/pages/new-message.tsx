import React from "react";
import { cn } from "@/utils/utils";
import ChatSidebar from "@/components/templates/root/ChatSidebar/ChatSidebar";
import { NextPageWithLayout } from "@/pages/_app";
import { MainChatWrapper } from "@/pages/[chatroomId]";
import ScrollArea from "@/components/elements/ScrollArea";
import { Controller, FormProvider, useForm } from "react-hook-form";
import TextEditor from "@/components/modules/TextEditor/TextEditor";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";

const NewMessage: NextPageWithLayout = () => {
  const chatForm = useForm({
    resolver: zodResolver(
      z.object({
        text: z.string().min(1),
        content: z.any(),
      })
    ),
    defaultValues: {
      text: "",
      content: "",
    },
  });
  return (
    <>
      <div
        className={
          "flex w-full flex-[0_0_60px] items-center border-b-2 border-black"
        }
      >
        hello
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
      <FormProvider {...chatForm}>
        <form
          id={"message-text-input-form"}
          className={
            "flex w-full items-center justify-between space-x-4 bg-transparent bg-secondary px-6 py-3"
          }
          // onSubmit={chatForm.handleSubmit((data) => {
          //   sendMessage.mutate({
          //     ...data,
          //     chatroomId,
          //   });
          // })}
        >
          <Controller
            control={chatForm.control}
            render={({ field: { onChange, value } }) => {
              return <TextEditor onChange={onChange} content={value} />;
            }}
            name={"content"}
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
