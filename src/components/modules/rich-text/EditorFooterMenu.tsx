import React, { useLayoutEffect, useRef } from 'react';
import {
  isBlockActive,
  isMarkActive,
} from '@/components/modules/rich-text/utils';
import { IconButton } from '@/components/elements/IconButton';
import { ReactEditor, useFocused, useSlate } from 'slate-react';
import { LucideAnnoyed } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import EmojiPicker from 'emoji-picker-react';
import * as Popover from '@radix-ui/react-popover';
import { Transforms } from 'slate';

const EditorFooterMenu = () => {
  const editor = useSlate();
  const ref = useRef<HTMLDivElement | null>(null);
  const isCodeBlockActive = isBlockActive(editor, 'codeBlock');
  const [show, setShow] = React.useState(false);

  return (
    <div>
      <HoveringEmojiPicker setShow={setShow} open={show} />
      <div className="flex h-5 w-full items-center space-x-2">
        <IconButton
          type="button"
          size="sm"
          variant="ghost"
          state={isMarkActive(editor, 'bold') ? 'active' : 'default'}
          disabled={isCodeBlockActive}
          onClick={() => {
            ReactEditor.focus(editor);
            setShow(true);
          }}
        >
          <LucideAnnoyed size="18px" />
        </IconButton>
      </div>
    </div>
  );
};

const HoveringEmojiPicker = ({
  open,
  setShow,
}: {
  open: boolean;
  setShow: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const editor = useSlate();
  const inFocus = useFocused();

  useLayoutEffect(() => {
    const el = ref.current;

    if (!el) {
      return;
    }

    if (!open) {
      el.removeAttribute('style');
      return;
    }

    console.log('ELEMENT', el);
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
    <Dialog.Root
      open={open}
      onOpenChange={(open) => {
        setShow(open);
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
                  onEmojiClick={(emoji, event) => {
                    ReactEditor.focus(editor);
                    Transforms.insertText(editor, emoji.emoji, {
                      at: editor.selection,
                    });
                    setShow(false);
                  }}
                />
              </div>
            </Popover.Content>
          </Popover.Root>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default EditorFooterMenu;
