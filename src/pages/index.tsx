import { type NextPage } from "next";

import { api } from "@/utils/api";
import Input from "@/components/form/Input";
import { useForm } from "react-hook-form";
import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import Avatar from "@/components/Avatar";
import ChatWindow from "@/components/ChatWindow";
import ThreadListItem from "@/components/ThreadListItem";
import { getQueryKey } from "@trpc/react-query";

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

  const aiModels = api.openai.getModels.useQuery();
  const sendMessageToAi = api.messaging.sendMessageToAi.useMutation({
    onSettled: () => {
      queryClient.invalidateQueries(
        getQueryKey(api.messaging.getMessages, {
          chatroomId: "clfpepzy10000e6rgzrnq8ggc",
        })
      );
    },
  });

  const chatForm = useForm({
    defaultValues: {
      textPrompt: "",
    },
  });

  const sendApiPrompt = api.messaging.sendMessageToAi.useMutation();

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
          <div
            className={
              "flex w-full w-full flex-col space-y-7 bg-neutral px-5 py-8"
            }
          >
            <p className={"text-3xl font-semibold text-primary"}>Messages</p>
            <Input className={""} />
          </div>

          <div className={"flex w-full flex-col overflow-auto py-4 px-5"}>
            <ThreadListItem name={"Penis"} />
          </div>
        </ChatSidebarWrapper>
        <MainChatWrapper>
          <div className={"flex w-full rounded-3xl px-3 py-8"}>
            <div className={"flex items-start space-x-4"}>
              <Avatar alt={"C"} />
              <p className={"text-md text-black"}>Chat GPT</p>
            </div>
          </div>
          <ChatWindow aiTyping={sendApiPrompt.status === "loading"} />
          <form
            className={
              "flex  w-full items-center justify-between space-x-4 bg-transparent bg-secondary py-3"
            }
            onSubmit={chatForm.handleSubmit((data) => {
              sendMessageToAi.mutate({
                textPrompt: data.textPrompt,
                chatroomId: "clh4sfne50000e6b7s4764us2",
              });

              chatForm.reset();
            })}
          >
            <Input
              {...chatForm.register("textPrompt")}
              className={"flex-1 bg-secondary py-4 text-black"}
            />
          </form>
        </MainChatWrapper>
      </div>
    </div>
  );
};

export default Home;
