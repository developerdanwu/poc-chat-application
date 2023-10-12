import React, { useEffect, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import CollaborativeTextEditor from '@/components/modules/rich-text/CollaborativeTextEditor';
import BaseRichTextEditor from '@/components/modules/rich-text/BaseRichTextEditor';
import EditorMenuBar from '@/components/modules/rich-text/EditorMenuBar';
import EditorFooterMenu from '@/components/modules/rich-text/EditorFooterMenu';
import { safeJSONParse } from '@/lib/utils';
import {
  resetEditor,
  slateJSONToPlainText,
} from '@/components/modules/rich-text/utils';
import isHotkey from 'is-hotkey';
import { useRoom } from '../../../../../../liveblocks.config';
import * as Y from 'yjs';
import LiveblocksProvider from '@liveblocks/yjs';

const SendMessageTextEditor = ({
  chatFormRef,
}: {
  chatFormRef: React.RefObject<HTMLFormElement>;
}) => {
  const room = useRoom();
  const [connected, setConnected] = useState(false);
  const [sharedType, setSharedType] = useState<Y.XmlText>();
  const [provider, setProvider] =
    useState<LiveblocksProvider<any, any, any, any>>();
  // Set up Liveblocks Yjs provider
  useEffect(() => {
    const yDoc = new Y.Doc();
    const yProvider = new LiveblocksProvider(room, yDoc);
    const sharedDoc = yDoc.get('slate', Y.XmlText) as Y.XmlText;
    yProvider.on('sync', setConnected);

    setSharedType(sharedDoc);
    setProvider(yProvider);

    return () => {
      yDoc?.destroy();
      yProvider?.off('sync', setConnected);
      yProvider?.destroy();
    };
  }, [room]);

  const chatForm = useFormContext();

  if (!connected || !sharedType || !provider) {
    return <div>Loading…</div>;
  }

  return (
    <div className="flex h-full min-h-fit">
      <Controller
        control={chatForm.control}
        render={({ field: { value, onChange } }) => {
          return (
            <div className="flex h-auto  min-h-fit w-full flex-col space-y-2 rounded-md border border-slate-300 p-3">
              <CollaborativeTextEditor sharedType={sharedType}>
                {(editor) => (
                  <BaseRichTextEditor
                    editor={editor}
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
                          chatForm.setValue(
                            'text',
                            slateJSONToPlainText(value)
                          );
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
                )}
              </CollaborativeTextEditor>
            </div>
          );
        }}
        name="content"
      />
    </div>
  );
};

export default SendMessageTextEditor;
