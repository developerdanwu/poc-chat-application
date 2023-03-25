import { type NextPage } from "next";

import { api } from "@/utils/api";
import Input from "@/components/form/Input";
import ChatBubble from "@/components/ChatBubble";
import { create } from "zustand";
import { type ChatMessage } from "chatgpt";
import { v4 as uuidv4 } from "uuid";
import { useForm } from "react-hook-form";

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
  const chatForm = useForm({
    defaultValues: {
      textPrompt: "",
    },
  });

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
        <form
          className={"flex w-full justify-center p-5"}
          onSubmit={chatForm.handleSubmit((data) => {
            console.log("HELLO??", data.textPrompt);
            sendApiPrompt.mutate({
              textPrompt: data.textPrompt,
              ...(messages.length > 1 && {
                parentMessageId: messages[messages.length - 1]?.id,
              }),
            });
          })}
        >
          <Input {...chatForm.register("textPrompt")} />
          <button
            disabled={sendApiPrompt.status === "loading"}
            className={"btn-primary btn"}
            type={"submit"}
          >
            hello
          </button>
        </form>
      </div>
    </div>
  );
};

export default Home;
