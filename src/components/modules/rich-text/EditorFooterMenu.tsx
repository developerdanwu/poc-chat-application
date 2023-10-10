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
  const ref = useRef<HTMLDivElement | null>();
  const editor = useSlate();
  const inFocus = useFocused();
  // useClickAway(ref, () => {
  //   console.log('CLICK AWAY');
  //   setShow(false);
  // });
  useLayoutEffect(() => {
    const el = ref.current;

    console.log('ELEMENT??', el);
    if (!el) {
      return;
    }

    if (!open) {
      el.removeAttribute('style');
      return;
    }

    console.log('FIRED??');
    ReactEditor.focus(editor);

    const domSelection = window.getSelection();
    if (domSelection && domSelection.rangeCount > 0) {
      const domRange = domSelection.getRangeAt(0);
      const rect = domRange.getBoundingClientRect();
      console.log('WRECKED', rect);
      el.style.opacity = '1';
      el.style.top = `${rect.top + window.pageYOffset - el.offsetHeight}px`;
      el.style.left = `${
        rect.left + window.pageXOffset - el.offsetWidth / 2 + rect.width / 2
      }px`;
    }
  }, [ref.current]);
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(open) => {
        setShow(open);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="DialogOverlay" />
        <Dialog.Content className="emoji-picker absolute top-0" ref={ref}>
          <div>
            <EmojiPicker />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
      {/*{createPortal(*/}
      {/*  <div className="absolute top-0 opacity-0" ref={ref}>*/}
      {/*    <EmojiPicker />*/}
      {/*  </div>,*/}
      {/*  document.body*/}
      {/*)}*/}
    </Dialog.Root>
  );
};

export default EditorFooterMenu;
