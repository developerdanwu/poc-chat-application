import React from 'react';
import { cn } from '@/lib/utils';

const GlobalLoadingSkeleton = () => {
  return (
    <div
      className={cn(
        'bg-warm-gray-50 flex h-screen w-screen flex-row items-center  justify-center'
      )}
    >
      <div className="flex h-full flex-[0_0_256px] flex-col overflow-hidden  border-slate-300 bg-slate-900"></div>
      <div className="flex h-screen w-full flex-col items-center justify-center overflow-hidden ">
        <div className="flex w-full flex-[0_0_48px] items-center justify-start border-b border-slate-300" />
        <div className="flex w-full flex-[1_0_0] flex-col">
          <div className="flex-[1_1_0]" />
        </div>
        <div className="flex w-full flex-none items-center justify-between space-x-4 bg-white px-6 py-3">
          <div
            className={cn(
              'bord-erwarm-gray-400 group h-20 w-full rounded-lg border border-slate-300 px-3 py-3'
            )}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default GlobalLoadingSkeleton;
