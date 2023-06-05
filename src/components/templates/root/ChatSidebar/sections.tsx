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
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/elements/command';
import { Button } from '@/components/elements/Button';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/elements/avatar';
import { cn } from '@/lib/utils';

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
            <PopoverContent className="flex flex-col space-y-2" align="start">
              <p className="text-body font-semibold text-slate-900">
                Select AI
              </p>
              <Command>
                <CommandInput />
                <CommandList>
                  <CommandGroup>
                    <CommandItem>
                      <div className="flex items-center overflow-hidden">
                        <Avatar size="sm">
                          <AvatarImage
                            src="https://github.com/shadcn.png"
                            alt="@shadcn"
                          />
                          <AvatarFallback>CN</AvatarFallback>
                        </Avatar>
                        <p
                          className={cn(
                            'select-none overflow-hidden overflow-ellipsis whitespace-nowrap pl-3 text-xs font-normal leading-4 text-slate-400'
                          )}
                        >
                          Chat GPT
                        </p>
                      </div>
                    </CommandItem>
                    <CommandItem>
                      <div className="flex items-center overflow-hidden">
                        <Avatar size="sm">
                          <AvatarImage
                            src="https://github.com/shadcn.png"
                            alt="@shadcn"
                          />
                          <AvatarFallback>CN</AvatarFallback>
                        </Avatar>
                        <p
                          className={cn(
                            'select-none overflow-hidden overflow-ellipsis whitespace-nowrap pl-3 text-xs font-normal leading-4 text-slate-400'
                          )}
                        >
                          hello
                        </p>
                      </div>
                    </CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
              <Button className="w-full" size="sm">
                start chat
              </Button>
            </PopoverContent>
          </Popover>
        </div>
      </Collapsible>
    </>
  );
};
