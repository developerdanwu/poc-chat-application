import React, { useState } from 'react';
import {
  Collapsible,
  CollapsibleTrigger,
} from '@/components/elements/collapsible';
import { IconButton } from '@/components/elements/IconButton';
import { Check, ChevronDownIcon, Plus } from 'lucide-react';
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
import { api } from '@/lib/api';
import { AiModel } from '../../../../../prisma/generated/types';
import { useRouter } from 'next/router';

const AI_MODELS = [
  {
    name: 'Open AI',
    value: AiModel.OPENAI,
    image: '/static/openai.png',
  },
];

export const AiModelsSection = () => {
  const [selectedAi, setSelectedAi] = useState<AiModel | ''>('');
  const router = useRouter();
  const startAiChat = api.messaging.startAiChat.useMutation({
    onSuccess: (data) => {
      router.push(`/${data.id}`);
    },
  });
  console.log('selected', selectedAi);
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
                    {AI_MODELS.map((model) => {
                      return (
                        <CommandItem
                          value={model.value}
                          onSelect={(currentValue) => {
                            console.log('VAL', currentValue);
                            setSelectedAi((prev) =>
                              prev === currentValue.toUpperCase()
                                ? ''
                                : (currentValue.toUpperCase() as AiModel)
                            );
                          }}
                          key={model.value}
                        >
                          <div className="flex items-center overflow-hidden">
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                selectedAi === model.value
                                  ? 'opacity-100'
                                  : 'opacity-0'
                              )}
                            />
                            <Avatar size="sm">
                              <AvatarImage src={model.image} alt="@shadcn" />
                              <AvatarFallback>CN</AvatarFallback>
                            </Avatar>
                            <p
                              className={cn(
                                'select-none overflow-hidden overflow-ellipsis whitespace-nowrap pl-3 text-xs font-normal leading-4 text-slate-400'
                              )}
                            >
                              {model.name}
                            </p>
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
              <Button
                disabled={!selectedAi}
                onClick={() => {
                  if (selectedAi) {
                    startAiChat.mutate({ aiModel: selectedAi });
                  }
                }}
                className="w-full"
                size="sm"
              >
                start chat
              </Button>
            </PopoverContent>
          </Popover>
        </div>
      </Collapsible>
    </>
  );
};
