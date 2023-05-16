import React from 'react';

const ChatLoadingSkeleton = () => {
  return (
    <div className="flex w-full animate-pulse">
      <div className="flex-shrink-0">
        <span className="block h-12 w-12 rounded-full bg-warm-gray-200"></span>
      </div>
      <div className="ml-4 mt-2 w-full">
        <h3 className="h-4 w-20 rounded-md bg-warm-gray-200"></h3>
        <ul className="mt-5 space-y-3">
          <li className="h-4 w-full rounded-md bg-warm-gray-200"></li>
          <li className="h-4 w-full rounded-md bg-warm-gray-200"></li>
          <li className="h-4 w-full rounded-md bg-warm-gray-200"></li>
          <li className="h-4 w-full rounded-md bg-warm-gray-200"></li>
        </ul>
      </div>
    </div>
  );
};

export default ChatLoadingSkeleton;
