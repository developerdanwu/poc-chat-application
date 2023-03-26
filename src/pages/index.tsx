import { type NextPage } from "next";

import { api } from "@/utils/api";
import Input from "@/components/form/Input";
import { create } from "zustand";
import { type ChatMessage } from "chatgpt";
import { v4 as uuidv4 } from "uuid";
import { useForm } from "react-hook-form";
import { BaseDirectory, readTextFile, writeFile } from "@tauri-apps/api/fs";
import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Avatar from "@/components/Avatar";
import ChatWindow from "@/components/ChatWindow";
import ThreadListItem from "@/components/ThreadListItem";

type UserMessage = {
  id: string;
  text: string;
  role: "user";
};

export const useChatStore = create<{
  messages: (ChatMessage | UserMessage)[];
  addAiMessage: (message: ChatMessage) => void;
  addUserMessage: (message: UserMessage) => void;
}>((set) => ({
  messages: [],
  addAiMessage: (message: ChatMessage) =>
    set((state) => ({ ...state, messages: [...state.messages, message] })),
  addUserMessage: (message: UserMessage) =>
    set((state) => ({ ...state, messages: [...state.messages, message] })),
}));

const ChatSidebarWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className={"flex h-full max-w-[30%] flex-[0_0_30%] flex-col "}>
      {children}
    </div>
  );
};

const MainChatWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className={"flex h-full w-full flex-col items-center justify-center"}>
      {children}
    </div>
  );
};

const Home: NextPage = () => {
  const chatStore = useChatStore();
  const textFile = useQuery({
    queryKey: ["textFile"],
    queryFn: async () => {
      const text = await readTextFile("data.json", {
        dir: BaseDirectory.Desktop,
      });
      return JSON.parse(text) as string[];
    },
  });
  const test = api.messaging.getUserId.useQuery();
  const aiModels = api.openai.getModels.useQuery();

  console.log("DATA", textFile.data);
  const chatForm = useForm({
    defaultValues: {
      textPrompt: "",
    },
  });
  useEffect(() => {
    const test = async () => {
      try {
        const testing = await writeFile(
          {
            contents: "[]",
            path: "data.json",
          },
          {
            dir: BaseDirectory.Desktop,
          }
        );

        console.log(testing);
      } catch (e) {
        console.log("ERROR", e);
      }
    };
    test();
  }, []);

  const sendApiPrompt = api.chatGpt.sendAiPrompt.useMutation({
    onMutate: (variables) => {
      chatStore.addUserMessage({
        id: uuidv4(),
        text: variables.textPrompt,
        role: "user",
      });
    },
    onSuccess: (message) => {
      chatStore.addAiMessage(message);
    },
  });
  const messages = chatStore.messages;

  return (
    <div
      className={
        "flex h-screen w-screen flex-row items-center justify-center bg-neutral-focus"
      }
    >
      <div
        className={
          "flex h-full w-full max-w-[1600px] flex-row divide-x divide-neutral p-5"
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
          <div className={"flex  w-full w-full bg-neutral px-4 py-2"}>
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
              sendApiPrompt.mutate({
                textPrompt: data.textPrompt,
                ...(messages.length > 1 && {
                  parentMessageId: messages[messages.length - 1]?.id,
                }),
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
