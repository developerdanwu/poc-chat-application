// This example is for an Editor with `ReactEditor` and `HistoryEditor`
import { type BaseEditor, type Element, type Range } from 'slate';
import { type ReactEditor } from 'slate-react';
import { type HistoryEditor } from 'slate-history';

export type CustomEditor = BaseEditor &
  ReactEditor &
  HistoryEditor & {
    nodeToDecorations: Map<Element, Range[]>;
  };

export type ParagraphElement = {
  type: 'paragraph';
  children: CustomText[];
};

export type CodeBlockElement = {
  type: 'codeBlock';
  language: string;
  children: CustomElement[];
};

export type CodeLineElement = {
  type: 'codeLine';
  children: CustomText[];
};

export type CustomElement =
  | ParagraphElement
  | CodeBlockElement
  | CodeLineElement;

export type CustomRange = Range & { token: boolean };

interface FormattedText {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  code?: boolean;
  strike?: boolean;
}

export type CustomText = FormattedText;

declare module 'slate' {
  interface CustomTypes {
    Editor: CustomEditor;
    Element: CustomElement;
    Text: CustomText;
    Range: CustomRange;
  }
}
