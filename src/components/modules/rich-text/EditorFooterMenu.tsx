import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { isBlockActive } from '@/components/modules/rich-text/utils';
import { IconButton } from '@/components/elements/IconButton';
import { ReactEditor, useFocused, useSlate } from 'slate-react';
import { LucideAnnoyed } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import EmojiPicker from 'emoji-picker-react';
import { Transforms } from 'slate';
import * as Popover from '@radix-ui/react-popover';
import { type RouterOutput } from '@/server/api/root';
import {
  Popover as PopoverRoot,
  PopoverContent,
} from '@/components/elements/popover';
import BaseRichTextEditor from '@/components/modules/rich-text/BaseRichTextEditor';
import { useSendMessagebar } from '@/pages/[chatroomId]/_components/main/SendMessagebar/SendMessagebarProvider';

export const HoveringPeekMessage = ({
  authors,
}: {
  authors: RouterOutput['chatroom']['getChatroom']['authors'];
}) => {
  const inFocus = useFocused();
  const ref = useRef<HTMLDivElement | null>(null);
  const editor = useSlate();
  const sendMessagebar = useSendMessagebar((state) => ({
    setPeekMessageOpen: state.setPeekMessageOpen,
    peekMessageOpen: state.peekMessageOpen,
  }));
  useEffect(() => {
    const el = ref.current;
    const { selection } = editor;

    if (!el) {
      return;
    }

    if (!selection || !inFocus || !sendMessagebar.peekMessageOpen) {
      el.removeAttribute('style');
      return;
    }

    const domSelection = window.getSelection();
    const domRange = domSelection.getRangeAt(0);
    const rect = domRange.getBoundingClientRect();
    el.style.opacity = '1';
    el.style.top = `${rect.top + window.pageYOffset - el.offsetHeight - 8}px`;
    el.style.left = `${
      rect.left + window.pageXOffset - el.offsetWidth / 2 + rect.width / 2
    }px`;
  });

  return (
    <>
      <PopoverRoot open={false}>
        <PopoverContent
          onFocus={(e) => {
            e.preventDefault();
          }}
          className="absolute opacity-0"
          align="start"
          ref={ref}
        >
          <div>
            {authors.map((author) => {
              return (
                <BaseRichTextEditor
                  key={author.author_id}
                  slotProps={{
                    root: {
                      initialValue: [
                        {
                          type: 'paragraph',
                          children: [{ text: '' }],
                        },
                      ],
                    },
                    editable: {
                      readOnly: true,
                    },
                  }}
                />
              );
            })}
          </div>
        </PopoverContent>
      </PopoverRoot>
      {/*<PopoverRoot open={true}>*/}
      {/*  <PopoverTrigger />*/}
      {/*  <PopoverContent align="start">*/}
      {/*    */}
      {/*  </PopoverContent>*/}
      {/*</PopoverRoot>*/}
    </>
  );
};

export const HoveringEmojiPicker = () => {
  const ref = useRef<HTMLDivElement | null>(null);
  const editor = useSlate();
  const inFocus = useFocused();
  const isCodeBlockActive = isBlockActive(editor, 'codeBlock');
  const [open, setOpen] = React.useState(false);

  useLayoutEffect(() => {
    const el = ref.current;

    if (!el) {
      return;
    }

    if (!open) {
      el.removeAttribute('style');
      return;
    }

    ReactEditor.focus(editor);
    const domSelection = window.getSelection();
    if (domSelection && domSelection.rangeCount > 0) {
      const domRange = domSelection.getRangeAt(0);
      const rect = domRange.getBoundingClientRect();
      el.style.opacity = '1';
      el.style.top = `${rect.top + window.pageYOffset - el.offsetHeight}px`;
      el.style.left = `${
        rect.left + window.pageXOffset - el.offsetWidth / 2 + rect.width / 2
      }px`;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inFocus]);

  return (
    <>
      <IconButton
        type="button"
        size="sm"
        variant="ghost"
        disabled={isCodeBlockActive}
        onClick={() => {
          ReactEditor.focus(editor);
          setOpen(true);
        }}
      >
        <LucideAnnoyed size="16px" />
      </IconButton>
      <Dialog.Root
        open={open}
        onOpenChange={(open) => {
          setOpen(open);
        }}
      >
        <Dialog.Overlay className="DialogOverlay" />
        <Dialog.Portal>
          <Dialog.Content className="emoji-picker absolute top-0" ref={ref}>
            <Popover.Root open={true}>
              <Popover.Trigger />
              <Popover.Content>
                <div>
                  <EmojiPicker
                    onEmojiClick={(emoji) => {
                      ReactEditor.focus(editor);
                      Transforms.insertText(editor, emoji.emoji, {
                        at: editor.selection,
                      });
                      setOpen(false);
                    }}
                  />
                </div>
              </Popover.Content>
            </Popover.Root>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
};
