import { NextPageWithLayout } from "@/pages/_app";
import { cn } from "@/utils/utils";
import ChatSidebar from "@/components/templates/root/ChatSidebar/ChatSidebar";
import React from "react";
import { useRouter } from "next/router";
import ChatTopControls from "@/components/templates/root/ChatTopControls";
import ChatWindow from "@/components/templates/root/ChatWindow/ChatWindow";
import { Controller, FormProvider, useForm } from "react-hook-form";
import TextEditor from "@/components/modules/TextEditor/TextEditor";
import { api } from "@/utils/api";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";

const MainChatWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      className={
        "flex h-full w-full flex-col items-center justify-center overflow-hidden bg-warm-gray-50 "
      }
    >
      {children}
    </div>
  );
};

const ChatroomId: NextPageWithLayout = () => {
  const router = useRouter();
  const chatroomId =
    typeof router.query.chatroomId === "string" ? router.query.chatroomId : "";
  const sendMessage = api.messaging.sendMessage.useMutation({
    onMutate: () => {
      chatForm.reset();
    },
  });

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
      {typeof router.query.chatroomId === "string" && (
        <MainChatWrapper>
          <ChatTopControls chatroomId={chatroomId} />
          <ChatWindow chatroomId={router.query.chatroomId} />
          <FormProvider {...chatForm}>
            <form
              id={"message-text-input-form"}
              className={
                "flex w-full items-center justify-between space-x-4 bg-transparent bg-secondary px-6 py-3"
              }
              onSubmit={chatForm.handleSubmit((data) => {
                sendMessage.mutate({
                  ...data,
                  chatroomId,
                });
              })}
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
        </MainChatWrapper>
      )}
    </>
  );
};

ChatroomId.getLayout = function getLayout(page) {
  return (
    <div
      className={cn(
        "flex h-screen w-screen flex-row items-center justify-center bg-warm-gray-50"
      )}
    >
      <div className={cn("flex h-full w-full flex-row")}>
        <ChatSidebar />
        {page}
      </div>
    </div>
  );
};

export default ChatroomId;
