import React from 'react';
import {
  Collapsible,
  CollapsibleTrigger,
} from '@/components/elements/collapsible';
import { IconButton } from '@/components/elements/IconButton';
import { ChevronDownIcon, Plus } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/elements/popover';
import { Command, CommandInput } from '@/components/elements/command';

export const AiModelsSection = () => {
  return (
    <>
      <Collapsible defaultOpen={true}>
        <div className="flex justify-between px-3">
          <div className="flex items-center space-x-2 ">
            <CollapsibleTrigger>
              <IconButton
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:bg-slate-700 hover:text-slate-400"
              >
                <ChevronDownIcon size={16} />
              </IconButton>
            </CollapsibleTrigger>
            <div className="text-body text-slate-400">AI models</div>
          </div>
          <Popover>
            <PopoverTrigger>
              <IconButton
                className="text-slate-400 hover:bg-slate-700 hover:text-slate-400"
                variant="ghost"
                size="sm"
              >
                <Plus size={16} />
              </IconButton>
            </PopoverTrigger>
            <PopoverContent align="start">
              <p className="text-body font-semibold text-slate-900">
                Select AI
              </p>
              <Command>
                <CommandInput />
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </Collapsible>
    </>
  );
};
