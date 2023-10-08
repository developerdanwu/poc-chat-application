import { type RenderLeafProps } from 'slate-react';
import React from 'react';

const Leaf = ({ attributes, children, leaf }: RenderLeafProps) => {
  const { text, bold, code, italic, underline, ...rest } = leaf;
  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }

  if (leaf.code) {
    children = <code>{children}</code>;
  }

  if (leaf.italic) {
    children = <em>{children}</em>;
  }

  if (leaf.underline) {
    children = <u>{children}</u>;
  }

  if (leaf.strike) {
    children = <s>{children}</s>;
  }

  return (
    <span {...attributes} className={Object.keys(rest).join(' ')}>
      {children}
    </span>
  );
};

export default Leaf;
