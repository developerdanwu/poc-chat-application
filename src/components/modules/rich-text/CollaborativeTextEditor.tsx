import React, { useEffect, useState } from 'react';
import { withYjs, YjsEditor } from '@slate-yjs/core';
import { withHistory } from 'slate-history';
import { withReact } from 'slate-react';
import { createEditor, Editor, Transforms } from 'slate';
import type * as Y from 'yjs';

const emptyNode = {
  type: 'paragraph',
  children: [{ text: '' }],
} as const;

const CollaborativeTextEditor = ({
  sharedType,
  children,
}: {
  sharedType: Y.XmlText;
  children: (editor: Editor) => React.ReactNode;
}) => {
  const [editor] = useState(() => {
    const e = withHistory(withReact(withYjs(createEditor(), sharedType)));

    // // Ensure editor always has at least 1 valid child
    const { normalizeNode } = e;
    e.normalizeNode = (entry) => {
      const [node] = entry;

      if (!Editor.isEditor(node) || node.children.length > 0) {
        return normalizeNode(entry);
      }

      Transforms.insertNodes(editor, emptyNode, { at: [0] });
    };

    return e;
  });

  useEffect(() => {
    YjsEditor.connect(editor);
    return () => {
      YjsEditor.disconnect(editor);
    };
  }, [editor]);

  return <>{children(editor)}</>;
};

export default CollaborativeTextEditor;
