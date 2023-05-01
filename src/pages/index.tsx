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
        "flex h-full max-w-[30%] flex-[0_0_30%] flex-col overflow-hidden rounded-3xl "
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
        "flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-3xl bg-neutral px-4"
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
        "flex h-screen w-screen flex-row items-center justify-center bg-neutral-focus"
      }
    >
      <div
        className={
          "flex h-full w-full max-w-[1600px] flex-row space-x-3 divide-neutral p-5"
        }
      >
        <ChatSidebarWrapper>
          <div className={"flex  w-full w-full bg-neutral px-2 py-2"}>
            <Avatar alt={"C"} />
          </div>
          <div className={"flex w-full flex-col overflow-auto py-4"}>
            {aiModels.data?.data?.map((m) => {
              return (
                <ThreadListItem
                  key={m.id}
                  name={m.id}
                  lastMessage={m.owned_by}
                />
              );
            })}
          </div>
        </ChatSidebarWrapper>
        <MainChatWrapper>
          <div className={"flex w-full rounded-3xl px-4 py-8"}>
            <div className={"flex items-center space-x-4"}>
              <Avatar alt={"C"} />
              <p>Chat GPT</p>
            </div>
          </div>
          <ChatWindow aiTyping={sendApiPrompt.status === "loading"} />
          <form
            className={
              "flex h-16 w-full items-center justify-between space-x-4 bg-neutral px-4"
            }
            onSubmit={chatForm.handleSubmit((data) => {
              sendMessageToAi.mutate({
                textPrompt: data.textPrompt,
                chatroomId: "clh4sfne50000e6b7s4764us2",
              });

              chatForm.reset();
            })}
          >
            <Input {...chatForm.register("textPrompt")} className={"flex-1"} />
          </form>
        </MainChatWrapper>
      </div>
    </div>
  );
};

export default Home;
