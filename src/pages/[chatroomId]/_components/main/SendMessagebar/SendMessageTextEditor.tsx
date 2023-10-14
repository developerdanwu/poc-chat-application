import React, { useState } from 'react';
import { Controller, useFormContext, useFormState } from 'react-hook-form';
import BaseRichTextEditor from '@/components/modules/rich-text/BaseRichTextEditor';
import {
  HoveringEmojiPicker,
  HoveringPeekMessage,
} from '@/components/modules/rich-text/EditorFooterMenu';
import { safeJSONParse, useApiTransformUtils } from '@/lib/utils';
import {
  resetEditor,
  slateJSONToPlainText,
  toggleMark,
} from '@/components/modules/rich-text/utils';
import isHotkey from 'is-hotkey';
import {
  useBroadcastEvent,
  useEventListener,
} from '../../../../../../liveblocks.config';
import { api } from '@/lib/api';
import { useAblyStore } from '@/lib/ably';
import { IconButton } from '@/components/elements/IconButton';
import { MdSend } from 'react-icons/md';
import EditorMenuBar from '@/components/modules/rich-text/EditorMenuBar';
import { useSendMessagebar } from '@/pages/[chatroomId]/_components/main/SendMessagebar/SendMessagebarProvider';

const MARKS_HOTKEYS = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+u': 'underline',
  'mod+`': 'code',
} as const;

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
  const { isValid } = useFormState({
    control: chatForm.control,
  });
  const chatroomDetail = api.chatroom.getChatroom.useQuery({
    chatroomId,
  });
  const { filterAuthedUserFromChatroomAuthors } = useApiTransformUtils();
  const filteredAuthors = filterAuthedUserFromChatroomAuthors(
    chatroomDetail.data?.authors || []
  );
  const sendMessagebar = useSendMessagebar((state) => ({
    setPeekMessageOpen: state.setPeekMessageOpen,
    peekMessageOpen: state.peekMessageOpen,
  }));
  const ownAuthor = api.chatroom.getOwnAuthor.useQuery();
  const ablyStore = useAblyStore((state) => ({
    addTypingToQueue: state.addTypingToQueue,
    removeTypingFromQueue: state.removeTypingFromQueue,
    typing: state.typing,
    setChatroomEditorContent: state.setChatroomEditorContent,
    chatroomContent: state.chatroomEditorContent,
  }));

  useEventListener(({ event }) => {
    switch (event.type) {
      case 'typing_message': {
        ablyStore.addTypingToQueue({
          authorId: event.data.author_id,
          chatroomId: event.data.chatroom_id,
        });
        ablyStore.setChatroomEditorContent({
          chatroomId: event.data.chatroom_id,
          content: event.data.content,
          authorId: event.data.author_id,
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

  return (
    <div className="flex h-full min-h-fit">
      <Controller
        control={chatForm.control}
        render={({ field: { value, onChange } }) => {
          return (
            <div className="flex h-auto  min-h-fit w-full flex-col space-y-2 rounded-md border border-slate-300 p-3">
              <BaseRichTextEditor
                header={<EditorMenuBar />}
                footer={
                  <>
                    <div className="flex h-5 w-full items-center justify-between">
                      <HoveringPeekMessage authors={filteredAuthors} />
                      <HoveringEmojiPicker />
                      <IconButton
                        disabled={!isValid}
                        size="sm"
                        type="button"
                        variant="default"
                      >
                        <MdSend size="16px" />
                      </IconButton>
                    </div>
                  </>
                }
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
                        resetEditor(editor, {
                          insertEmptyNode: true,
                        });
                        event.preventDefault();
                        chatFormRef.current?.dispatchEvent(
                          new Event('submit', {
                            cancelable: true,
                            bubbles: true,
                          })
                        );
                      }

                      // marks
                      for (const hotkey in MARKS_HOTKEYS) {
                        if (isHotkey(hotkey, event as any)) {
                          event.preventDefault();
                          const mark =
                            MARKS_HOTKEYS[hotkey as keyof typeof MARKS_HOTKEYS];
                          toggleMark(editor, mark);
                        }
                      }

                      // peek message
                      if (isHotkey('mod+alt+e', event as any)) {
                        event.preventDefault();
                        sendMessagebar.setPeekMessageOpen(
                          !sendMessagebar.peekMessageOpen
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
