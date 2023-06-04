import React from 'react';
import { cn } from '@/lib/utils';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/elements/avatar';

const ThreadListItem = ({
  name,
  selected,
  helperText,
}: {
  helperText?: string;
  selected?: boolean;
  name: string;
}) => {
  return (
    <div
      className={cn(
        'flex w-full cursor-pointer items-center justify-between rounded-sm py-2 px-2 hover:bg-slate-700',
        {
          'bg-slate-500 hover:bg-slate-500': selected,
        }
      )}
    >
      <div className="flex items-center overflow-hidden">
        <Avatar size="sm">
          <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <p
          className={cn(
            'select-none overflow-hidden overflow-ellipsis whitespace-nowrap pl-3 text-xs font-normal leading-4 text-slate-400',
            {
              'text-white': selected,
            }
          )}
        >
          {name}
        </p>
      </div>

      <p
        className={cn(
          'text-warm-gray-400 select-none text-xs font-normal leading-4',
          {
            'text-white': selected,
          }
        )}
      >
        {helperText}
      </p>
    </div>
  );
};

export default ThreadListItem;
