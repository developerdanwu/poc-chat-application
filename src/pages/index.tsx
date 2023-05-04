import { type NextPage } from "next";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/utils/api";
import Input from "@/components/form/Input";
import { Controller, FormProvider, useForm } from "react-hook-form";
import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import Avatar from "@/components/Avatar";
import ThreadListItem from "@/components/ThreadListItem";
import { getQueryKey } from "@trpc/react-query";
import ChatWindow from "@/components/ChatWindow";
import { useRouter } from "next/router";
import TextEditor from "@/components/elements/TextEditor";
import z from "zod";

const ChatSidebarWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      className={
        "flex h-full max-w-[30%] flex-[0_0_30%] flex-col overflow-hidden rounded-3xl bg-white"
      }
    >
      {children}
    </div>
  );
};

const MainChatWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      className={
        "flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-3xl bg-white px-4"
      }
    >
      {children}
    </div>
  );
};

const Home: NextPage = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const chatroomId =
    typeof router.query.chatroomId === "string" ? router.query.chatroomId : "";
  const sendMessageToAi = api.messaging.sendMessageToAi.useMutation({
    onSettled: () => {
      queryClient.invalidateQueries(
        getQueryKey(api.messaging.getMessages, {
          chatroomId,
        })
      );
    },
    onMutate: () => {
      chatForm.reset();
    },
  });
  const chatrooms = api.messaging.getAllChatrooms.useQuery();

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
    <div
      className={
        "flex h-screen w-screen flex-row items-center justify-center bg-secondary"
      }
    >
      <div
        className={
          "flex h-full w-full max-w-[1600px] flex-row space-x-3 divide-neutral p-5"
        }
      >
        <ChatSidebarWrapper>
          <div className={"flex w-full w-full flex-col space-y-7  px-5 py-8"}>
            <p className={"text-3xl font-semibold text-primary"}>Messages</p>
            <Input className={""} />
          </div>

          <div className={"flex w-full flex-col overflow-auto py-4 px-5"}>
            {chatrooms.data?.map((chatroom) => {
              return (
                <ThreadListItem
                  chatroomId={chatroom.id}
                  key={chatroom.id}
                  name={chatroom.id}
                />
              );
            })}
          </div>
        </ChatSidebarWrapper>
        {typeof router.query.chatroomId === "string" && (
          <MainChatWrapper>
            <div className={"flex w-full rounded-3xl px-3 py-8"}>
              <div className={"flex items-start space-x-4"}>
                <Avatar alt={"C"} />
                <p className={"text-md text-black"}>Chat GPT</p>
              </div>
            </div>
            <ChatWindow chatroomId={router.query.chatroomId} />
            <FormProvider {...chatForm}>
              <form
                id={"message-text-input-form"}
                className={
                  "flex  w-full items-center justify-between space-x-4 bg-transparent bg-secondary py-3"
                }
                onSubmit={chatForm.handleSubmit((data) => {
                  sendMessageToAi.mutate({
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
      </div>
    </div>
  );
};

export default Home;
