import { type NextPage } from "next";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/utils/api";
import Input from "@/components/elements/Input";
import { Controller, FormProvider, useForm } from "react-hook-form";
import React from "react";
import ThreadListItem from "@/components/templates/root/ThreadListItem";
import ChatWindow from "@/components/templates/root/ChatWindow/ChatWindow";
import { useRouter } from "next/router";
import TextEditor from "@/components/elements/TextEditor";
import z from "zod";
import { notEmpty } from "@/utils/ts-utils";
import ChatTopControls from "@/components/templates/root/ChatTopControls";
import { RiPencilLine } from "react-icons/ri";

const ChatSidebarWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      className={
        "flex h-full flex-[0_0_256px] flex-col overflow-hidden border-r-2 border-black bg-warm-gray-200 "
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
        "flex h-full w-full flex-col items-center justify-center overflow-hidden bg-warm-gray-50 "
      }
    >
      {children}
    </div>
  );
};

const Home: NextPage = () => {
  const router = useRouter();
  const chatroomId =
    typeof router.query.chatroomId === "string" ? router.query.chatroomId : "";

  const sendMessage = api.messaging.sendMessage.useMutation({
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
        "flex h-screen w-screen flex-row items-center justify-center bg-warm-gray-50"
      }
    >
      <div className={"flex h-full w-full  flex-row"}>
        <ChatSidebarWrapper>
          <div
            className={
              "mb-4 flex w-full flex-[0_0_60px] items-center space-x-2 border-b-2 border-black px-3"
            }
          >
            <Input className={""} />
            <button className={"btn-outline btn-sm btn-circle btn"}>
              <RiPencilLine />
            </button>
          </div>

          <div className={"flex w-full flex-col overflow-auto p-3"}>
            {chatrooms.data?.map((chatroom) => {
              return (
                <ThreadListItem
                  chatroomId={chatroom.id}
                  key={chatroom.id}
                  selected={chatroomId === chatroom.id}
                  // TODO: setup page to let user fill in important details
                  name={chatroom.users
                    .map((author) => author?.firstName)
                    .filter(notEmpty)
                    .join(", ")}
                />
              );
            })}
          </div>
        </ChatSidebarWrapper>
        {typeof router.query.chatroomId === "string" && (
          <MainChatWrapper>
            <ChatTopControls chatroomId={chatroomId} />
            <ChatWindow chatroomId={router.query.chatroomId} />
            <FormProvider {...chatForm}>
              <form
                id={"message-text-input-form"}
                className={
                  "flex w-full items-center justify-between space-x-4 bg-transparent bg-secondary px-3 py-3"
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
      </div>
    </div>
  );
};

export default Home;
