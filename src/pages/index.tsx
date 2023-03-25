import { type NextPage } from "next";

import { api } from "@/utils/api";
import { useState } from "react";
import Input from "@/components/form/Input";
import ChatBubble from "@/components/ChatBubble";
import { create } from "zustand";
import { type ChatMessage } from "chatgpt";
import { v4 as uuidv4 } from "uuid";

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

const Home: NextPage = () => {
  const chatStore = useChatStore();
  const [text, setText] = useState("");
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

  console.log(chatStore.messages);
  const completionApi = api.openai.createCompletion.useMutation({
    onMutate: (variables) => {},
  });
  const models = api.openai.getModels.useQuery();
  const messages = chatStore.messages;
  return (
    <div className={"flex h-screen w-screen flex-row"}>
      <div className={"h-full w-72 bg-black"}></div>
      <div
        className={"flex h-full w-full flex-col items-center justify-center"}
      >
        <div className={"flex h-full w-full flex-col p-7"}>
          {chatStore.messages.map((m) => {
            return (
              <ChatBubble
                key={m.id}
                direction={m.role === "user" ? "end" : "start"}
              >
                {m.text}
              </ChatBubble>
            );
          })}
        </div>
        <div className={"flex w-full justify-center p-5"}>
          <form>
            <Input
              value={text}
              onChange={(e) => {
                setText(e.target.value);
              }}
            />
            <button
              className={"btn-primary btn"}
              onClick={() => {
                sendApiPrompt.mutate({
                  textPrompt: text,
                  ...(messages.length > 1 && {
                    parentMessageId: messages[messages.length - 1]?.id,
                  }),
                });
              }}
            >
              hello
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Home;
