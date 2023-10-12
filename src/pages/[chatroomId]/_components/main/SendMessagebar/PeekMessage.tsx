import React, { useEffect, useState } from 'react';
import BaseRichTextEditor from '@/components/modules/rich-text/BaseRichTextEditor';
import CollaborativeTextEditor from '@/components/modules/rich-text/CollaborativeTextEditor';
import { useRoom } from '../../../../../../liveblocks.config';
import * as Y from 'yjs';
import LiveblocksProvider from '@liveblocks/yjs';

const PeekMessage = () => {
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

  if (!connected || !sharedType || !provider) {
    return <div>Loading…</div>;
  }

  return (
    <CollaborativeTextEditor sharedType={sharedType}>
      {(editor) => (
        <BaseRichTextEditor
          editor={editor}
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
      )}
    </CollaborativeTextEditor>
  );
};

export default PeekMessage;
