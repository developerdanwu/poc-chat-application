import { type NextPage } from "next";

import { api } from "@/utils/api";
import Input from "@/components/form/Input";
import ChatBubble from "@/components/ChatBubble";
import { create } from "zustand";
import { type ChatMessage } from "chatgpt";
import { v4 as uuidv4 } from "uuid";
import { useForm } from "react-hook-form";
import { BaseDirectory, readTextFile, writeFile } from "@tauri-apps/api/fs";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Avatar from "@/components/Avatar";

type UserMessage = {
  id: string;
  text: string;
  role: "user";
};

const useChatStore = create<{
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

const ChatWindowWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      className={
        "flex h-full w-full flex-col space-y-2 overflow-auto bg-black p-7"
      }
    >
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

  console.log(messages);
  return (
    <div
      className={
        "flex h-screen w-screen flex-row items-center justify-center bg-neutral-focus"
      }
    >
      <div
        className={
          "flex h-full w-full max-w-[1600px] flex-row divide-x divide-neutral-content p-5"
        }
      >
        <div className={"flex h-full max-w-[30%] flex-[0_0_30%] flex-col "}>
          <div className={"flex  w-full w-full bg-neutral px-4 py-2"}>
            <Avatar alt={"C"} />
          </div>
          <div></div>
        </div>
        <div
          className={"flex h-full w-full flex-col items-center justify-center"}
        >
          <div className={"flex  w-full w-full bg-neutral px-4 py-2"}>
            <div className={"flex items-center space-x-4"}>
              <Avatar alt={"C"} />
              <p>Chat GPT</p>
            </div>
          </div>
          <ChatWindowWrapper>
            {chatStore.messages.map((m) => {
              return (
                <ChatBubble
                  variant={m.role === "user" ? "accent" : "secondary"}
                  key={m.id}
                  direction={m.role === "user" ? "end" : "start"}
                >
                  {m.text}
                </ChatBubble>
              );
            })}
            {sendApiPrompt.status === "loading" && (
              <ChatBubble direction={"start"}>
                <div
                  className={"flex h-full w-max w-full items-center space-x-2"}
                >
                  <div
                    className={
                      "my-0 h-2 w-2 animate-typing-dot rounded-full bg-white"
                    }
                  />
                  <div
                    className={
                      "my-0  h-2 w-2 animate-typing-dot rounded-full bg-white animation-delay-100"
                    }
                  />
                  <div
                    className={
                      "my-0 h-2 w-2 animate-typing-dot rounded-full bg-white animation-delay-400"
                    }
                  />
                </div>
              </ChatBubble>
            )}
          </ChatWindowWrapper>
          <form
            className={
              "flex h-16 w-full items-center justify-between space-x-4 bg-neutral px-4"
            }
            onSubmit={chatForm.handleSubmit((data) => {
              console.log("HELLO??", data.textPrompt);
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
        </div>
      </div>
    </div>
  );
};

export default Home;
