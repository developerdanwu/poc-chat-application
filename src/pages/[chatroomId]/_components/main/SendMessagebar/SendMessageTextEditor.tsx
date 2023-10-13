import React, { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import BaseRichTextEditor from '@/components/modules/rich-text/BaseRichTextEditor';
import EditorMenuBar from '@/components/modules/rich-text/EditorMenuBar';
import EditorFooterMenu from '@/components/modules/rich-text/EditorFooterMenu';
import { safeJSONParse } from '@/lib/utils';
import {
  resetEditor,
  slateJSONToPlainText,
} from '@/components/modules/rich-text/utils';
import isHotkey from 'is-hotkey';
import {
  useBroadcastEvent,
  useEventListener,
} from '../../../../../../liveblocks.config';
import { api } from '@/lib/api';
import { useAblyStore } from '@/lib/ably';

const SendMessageTextEditor = ({
  chatroomId,
  chatFormRef,
}: {
  chatroomId: string;
  chatFormRef: React.RefObject<HTMLFormElement>;
}) => {
  const broadcast = useBroadcastEvent();
  const [timer, setTimer] = useState<number | undefined>(undefined);
  const chatForm = useFormContext();
  const ownAuthor = api.chatroom.getOwnAuthor.useQuery();
  const ablyStore = useAblyStore((state) => ({
    addTypingToQueue: state.addTypingToQueue,
    removeTypingFromQueue: state.removeTypingFromQueue,
    typing: state.typing,
  }));

  useEventListener(({ event }) => {
    switch (event.type) {
      case 'typing_message': {
        ablyStore.addTypingToQueue({
          authorId: event.data.author_id,
          chatroomId: event.data.chatroom_id,
        });
        break;
      }
      case 'stopped_typing': {
        ablyStore.removeTypingFromQueue({
          authorId: event.data.author_id,
          chatroomId: event.data.chatroom_id,
        });
        break;
      }
      default:
        break;
    }
  });

  console.log(ablyStore.typing);
  return (
    <div className="flex h-full min-h-fit">
      <Controller
        control={chatForm.control}
        render={({ field: { value, onChange } }) => {
          return (
            <div className="flex h-auto  min-h-fit w-full flex-col space-y-2 rounded-md border border-slate-300 p-3">
              <BaseRichTextEditor
                header={<EditorMenuBar />}
                footer={<EditorFooterMenu />}
                slotProps={{
                  root: {
                    initialValue: safeJSONParse(value) || [
                      {
                        type: 'paragraph',
                        children: [{ text: '' }],
                      },
                    ],
                    onChange: (value) => {
                      chatForm.setValue('text', slateJSONToPlainText(value));
                      clearTimeout(timer);

                      const newTimer = setTimeout(() => {
                        broadcast({
                          type: 'stopped_typing',
                          data: {
                            chatroom_id: chatroomId,
                            author_id: ownAuthor.data!.author_id,
                          },
                        });
                      }, 2000);

                      // @ts-expect-error error with timeout type
                      setTimer(newTimer);
                      broadcast({
                        type: 'typing_message',
                        data: {
                          chatroom_id: chatroomId,
                          content: JSON.stringify(value),
                          author_id: ownAuthor.data!.author_id,
                        },
                      });
                      onChange(value);
                    },
                  },
                  editable: {
                    placeholder: 'Type your message here...',
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
  );
};

export default SendMessageTextEditor;
