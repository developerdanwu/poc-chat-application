import React, { type RefObject, useRef } from 'react';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { api } from '@/lib/api';
import dayjs from 'dayjs';
import { type InfiniteData } from '@tanstack/react-query';
import { type RouterOutput } from '@/server/api/root';
import { zodResolver } from '@hookform/resolvers/zod';
import z from 'zod';
import {
  type ChatWindowRef,
  useChatroomState,
} from '@/pages/[chatroomId]/_components/main/main-content/ChatWindow';
import BaseRichTextEditor from '@/components/modules/rich-text/BaseRichTextEditor';
import { safeJSONParse } from '@/lib/utils';

import {
  resetEditor,
  slateJSONToPlainText,
} from '@/components/modules/rich-text/utils';
import isHotkey from 'is-hotkey';
import EditorMenuBar from '@/components/modules/rich-text/EditorMenuBar';
import useChatroomUpdateUtils from '@/pages/[chatroomId]/_components/useChatroomUpdateUtils';
import { v4 as uuid } from 'uuid';

const SendMessagebar = ({
  chatroomId,
  chatWindowRef,
}: {
  chatroomId: string;
  chatWindowRef: RefObject<ChatWindowRef>;
}) => {
  const chatroomUpdateUtils = useChatroomUpdateUtils();
  const chatroomState = useChatroomState((state) => ({
    setSentNewMessage: state.setSentNewMessage,
  }));
  const trpcUtils = api.useContext();
  const ownAuthor = api.chatroom.getOwnAuthor.useQuery();
  const chatFormRef = useRef<HTMLFormElement>(null);
  const chatForm = useForm({
    resolver: zodResolver(
      z.object({
        text: z.string().min(1),
        content: z.any(),
      })
    ),
    defaultValues: {
      text: '',
      content: '',
    },
  });

  const sendMessage = api.messaging.sendMessage.useMutation({
    mutationKey: ['sendMessage', chatroomId],
    onMutate: (variables) => {
      const oldData = trpcUtils.messaging.getMessages.getInfiniteData({
        chatroomId,
      });

      const flatMapMessages = oldData?.pages.flatMap((page) => page.messages);

      if (flatMapMessages && ownAuthor.data) {
        chatroomUpdateUtils.updateMessages({
          chatroomId: variables.chatroomId,
          message: {
            message_checksum: variables.messageChecksum,
            client_message_id:
              flatMapMessages.length > 0
                ? flatMapMessages[0]!.client_message_id + 1
                : 1,
            text: variables.text,
            content: variables.content,
            is_edited: false,
            created_at: dayjs.utc().toDate(),
            updated_at: dayjs.utc().toDate(),
            author_id: ownAuthor.data.author_id,
          },
        });
      }

      chatForm.reset();
      chatroomState.setSentNewMessage(variables.chatroomId, true);
      return {
        oldData,
      };
    },
    onError: (error, variables, context) => {
      const contextCast = context as {
        oldData?: InfiniteData<RouterOutput['messaging']['getMessages']>;
      };
      if (contextCast.oldData) {
        trpcUtils.messaging.getMessages.setInfiniteData(
          { chatroomId },
          () => contextCast.oldData
        );
      }
    },
  });

  return (
    <FormProvider {...chatForm}>
      <form
        ref={chatFormRef}
        id="message-text-input-form"
        className="h-auto min-h-fit overflow-hidden "
        onSubmit={chatForm.handleSubmit((data) => {
          sendMessage.mutate({
            ...data,
            content: JSON.stringify(data.content),
            chatroomId,
            messageChecksum: uuid(),
          });
        })}
      >
        <div className="flex h-full min-h-fit px-6 pb-4">
          <Controller
            control={chatForm.control}
            render={({ field: { value, onChange } }) => {
              return (
                <div className="flex h-auto  min-h-fit w-full flex-col space-y-2 rounded-md border border-slate-300 p-3">
                  <BaseRichTextEditor
                    header={<EditorMenuBar />}
                    slotProps={{
                      root: {
                        initialValue: safeJSONParse(value) || [
                          {
                            type: 'paragraph',
                            children: [{ text: '' }],
                          },
                        ],
                        onChange: (value) => {
                          chatForm.setValue(
                            'text',
                            slateJSONToPlainText(value)
                          );
                          onChange(value);
                        },
                      },
                      editable: {
                        onKeyDown: (event, editor) => {
                          if (isHotkey('enter', event as any)) {
                            // TODO: check if form valid before reset
                            resetEditor(editor);
                            event.preventDefault();
                            chatFormRef.current?.dispatchEvent(
                              new Event('submit', {
                                cancelable: true,
                                bubbles: true,
                              })
                            );
                          }
                        },
                      },
                    }}
                  />
                </div>
              );
            }}
            name="content"
          />
        </div>
      </form>
    </FormProvider>
  );
};

export default SendMessagebar;
