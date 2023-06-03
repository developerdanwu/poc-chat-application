import StarterKit from '@tiptap/starter-kit';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { lowlight } from 'lowlight';
import { Paragraph } from '@tiptap/extension-paragraph';

export const TipTapStarterKit = StarterKit.configure({
  codeBlock: false,
});

export const TiptapCodeBlockLight = CodeBlockLowlight.configure({
  HTMLAttributes: {
    spellcheck: 'false',
    autocomplete: 'false',
  },
  languageClassPrefix: 'codeblock-language-',
  lowlight,
});

export const TipTapParagraph = Paragraph.configure({
  HTMLAttributes: {
    class: 'text-subtle text-slate-700',
  },
});
