import React from 'react';
import { type RenderElementProps, useSlate } from 'slate-react';
import { cn } from '@/lib/utils';

const Element = ({ attributes, children, element }: RenderElementProps) => {
  const editor = useSlate();
  const defaultClasses = 'text-small';
  if (element.type === 'codeBlock') {
    return (
      <div
        {...attributes}
        className={cn(
          defaultClasses,
          'rounded-md bg-slate-900 p-3 font-mono text-white'
        )}
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
        className={cn(defaultClasses, 'relative text-white')}
      >
        {children}
      </div>
    );
  }

  const Tag = editor.isInline(element) ? 'span' : 'div';

  return (
    <Tag {...attributes} className={defaultClasses}>
      {children}
    </Tag>
  );
};

export default Element;
