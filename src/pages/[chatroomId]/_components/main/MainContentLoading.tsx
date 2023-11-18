import React from 'react';
import RadialProgress from '@/components/RadialProgress';
import {cn} from '@/lib/utils';

const MainContentLoading = () => {
    return (
        <>
            <div className="flex w-full flex-[0_0_48px] items-center justify-start border-b border-slate-300"/>
            <div className="flex w-full flex-[1_0_0] flex-col">
                <div className="flex-[1_1_0]"/>
                <div className="flex justify-center py-2">
                    <RadialProgress/>
                </div>
            </div>
            <div className="flex w-full flex-none items-center justify-between space-x-4 bg-white px-6 py-3">
                <div
                    className={cn(
                        'border-warm-gray-400 group h-20 w-full rounded-lg border border-slate-300 px-3 py-3'
                    )}
                ></div>
            </div>
        </>
    );
};

export default MainContentLoading;
