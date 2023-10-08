import React from 'react';
import { type RenderElementProps, useSlate } from 'slate-react';

const Element = ({ attributes, children, element }: RenderElementProps) => {
  const editor = useSlate();

  if (element.type === 'codeBlock') {
    return (
      <div
        data-type="codeBlock"
        {...attributes}
        style={{ position: 'relative' }}
        spellCheck={false}
      >
        {children}
      </div>
    );
  }

  if (element.type === 'codeLine') {
    return (
      <div
        {...attributes}
        data-type="codeLine"
        style={{ position: 'relative' }}
      >
        {children}
      </div>
    );
  }

  const Tag = editor.isInline(element) ? 'span' : 'div';

  return <Tag {...attributes}>{children}</Tag>;
};

export default Element;
