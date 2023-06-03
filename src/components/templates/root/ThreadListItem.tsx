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
        'hover:bg-warm-gray-300 flex w-full cursor-pointer items-center justify-between rounded-sm py-2 px-3',
        {
          'bg-gray-900 hover:bg-gray-900': selected,
        }
      )}
    >
      <div className="flex items-center">
        <Avatar>
          <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <p
          className={cn(
            'select-none pl-3 text-xs font-normal leading-4 text-white',
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
