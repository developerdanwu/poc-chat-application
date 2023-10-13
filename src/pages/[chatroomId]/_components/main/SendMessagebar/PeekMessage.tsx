import React from 'react';
import BaseRichTextEditor from '@/components/modules/rich-text/BaseRichTextEditor';

const PeekMessage = () => {
  return (
    <BaseRichTextEditor
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
};

export default PeekMessage;
