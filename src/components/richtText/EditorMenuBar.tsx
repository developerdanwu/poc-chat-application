import {useSlate} from 'slate-react';
import {isBlockActive, isMarkActive, toggleBlock, toggleMark,} from '@/components/richtText/utils';
import {IconButton} from '@/components/IconButton';
import {RiBold, RiCodeBoxLine, RiCodeLine, RiItalic, RiStrikethrough,} from 'react-icons/ri';
import React from 'react';
import {Separator} from '@/components/Separator';
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,} from '@/components/Tooltip';
import {CommandShortcut} from '@/components/Command';

export const CommandTooltipWrapper = ({
                                          children,
                                          command,
                                          description,
                                      }: {
    description: string;
    children: React.ReactNode;
    command?: string;
}) => {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger>{children}</TooltipTrigger>
                <TooltipContent>
                    <div className="flex flex-col items-center justify-center">
                        <p className="text-detail">{description}</p>
                        {command && (
                            <CommandShortcut className="ml-0 text-detail">
                                {command}
                            </CommandShortcut>
                        )}
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

const CodeBlockButton = () => {
    const editor = useSlate();
    const isCodeBlockActive = isBlockActive(editor, 'codeBlock');
    return (
        <CommandTooltipWrapper description="code block" command="⌘ Option Shift C">
            <IconButton
                size="sm"
                type="button"
                variant="ghost"
                state={isCodeBlockActive ? 'active' : 'default'}
                onClick={(e) => {
                    e.preventDefault();
                    toggleBlock(editor, 'codeBlock');
                }}
            >
                <RiCodeBoxLine size="16px"/>
            </IconButton>
        </CommandTooltipWrapper>
    );
};
const EditorMenuBar = () => {
    const editor = useSlate();

    const isCodeBlockActive = isBlockActive(editor, 'codeBlock');

    return (
        <div className="flex h-5 w-full items-center space-x-2">
            <CommandTooltipWrapper description="Bold" command="⌘B">
                <IconButton
                    type="button"
                    size="sm"
                    variant="ghost"
                    state={isMarkActive(editor, 'bold') ? 'active' : 'default'}
                    disabled={isCodeBlockActive}
                    onMouseDown={(e) => {
                        e.preventDefault();
                        toggleMark(editor, 'bold');
                    }}
                >
                    <RiBold size="16px"/>
                </IconButton>
            </CommandTooltipWrapper>
            <CommandTooltipWrapper description="Italic" command="⌘I">
                <IconButton
                    size="sm"
                    type="button"
                    variant="ghost"
                    state={isMarkActive(editor, 'italic') ? 'active' : 'default'}
                    disabled={isCodeBlockActive}
                    onMouseDown={(e) => {
                        e.preventDefault();
                        toggleMark(editor, 'italic');
                    }}
                >
                    <RiItalic size="16px"/>
                </IconButton>
            </CommandTooltipWrapper>
            <CommandTooltipWrapper description="Strikethrough" command="⌘S">
                <IconButton
                    size="sm"
                    type="button"
                    variant="ghost"
                    state={isMarkActive(editor, 'strike') ? 'active' : 'default'}
                    disabled={isCodeBlockActive}
                    onMouseDown={(e) => {
                        e.preventDefault();
                        toggleMark(editor, 'strike');
                    }}
                >
                    <RiStrikethrough size="16px"/>
                </IconButton>
            </CommandTooltipWrapper>

            <Separator orientation="vertical"/>
            <CommandTooltipWrapper description="code" command="⌘ Shift C">
                <IconButton
                    size="sm"
                    type="button"
                    variant="ghost"
                    state={isMarkActive(editor, 'code') ? 'active' : 'default'}
                    disabled={isCodeBlockActive}
                    onMouseDown={(e) => {
                        e.preventDefault();
                        toggleMark(editor, 'code');
                    }}
                >
                    <RiCodeLine size="16px"/>
                </IconButton>
            </CommandTooltipWrapper>
            <CodeBlockButton/>
        </div>
    );
};

export default EditorMenuBar;
