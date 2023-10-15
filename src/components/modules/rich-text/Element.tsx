import React from 'react';
import { type RenderElementProps, useSlate } from 'slate-react';

const Element = ({ attributes, children, element }: RenderElementProps) => {
  const editor = useSlate();

  if (element.type === 'codeBlock') {
    return (
      <div
        {...attributes}
        className="rounded-md bg-slate-900 p-3 font-mono text-sm text-white"
        style={{ position: 'relative' }}
        spellCheck={false}
      >
        {children}
      </div>
    );
  }

  if (element.type === 'codeLine') {
    return (
      <div {...attributes} style={{ position: 'relative' }}>
        {children}
      </div>
    );
  }

  const Tag = editor.isInline(element) ? 'span' : 'div';

  return (
    <Tag {...attributes} className="text-sm">
      {children}
    </Tag>
  );
};

export default Element;
