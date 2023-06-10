import React from 'react';

const ChatLoadingSkeletonSmallCell = () => {
  return (
    <div className="flex w-full animate-pulse">
      <div className="flex-shrink-0">
        <span className="block h-12 w-12 rounded-full bg-warm-gray-200"></span>
      </div>
      <div className="ml-4 mt-2 w-full">
        <div className="flex space-x-2">
          <h3 className="h-4 w-20 rounded-md bg-warm-gray-200"></h3>
          <h3 className="h-4 w-20 rounded-md bg-warm-gray-200"></h3>
        </div>
        <ul className="mt-3 space-y-3">
          <li className="h-4 w-full max-w-[240px] rounded-md bg-warm-gray-200"></li>
        </ul>
      </div>
    </div>
  );
};

const ChatLoadingSkeletonLargeCell = () => {
  return (
    <div className="flex w-full animate-pulse">
      <div className="flex-shrink-0">
        <span className="block h-12 w-12 rounded-full bg-warm-gray-200"></span>
      </div>
      <div className="ml-4 mt-2 w-full">
        <div className="flex space-x-2">
          <h3 className="h-4 w-20 rounded-md bg-warm-gray-200"></h3>
          <h3 className="h-4 w-20 rounded-md bg-warm-gray-200"></h3>
        </div>
        <ul className="mt-3 space-y-3">
          <li className="h-44 w-full max-w-[300px] rounded-md bg-warm-gray-200"></li>
        </ul>
      </div>
    </div>
  );
};

function ChatLoadingSkeleton() {
  return (
    <>
      <ChatLoadingSkeletonSmallCell />
      <ChatLoadingSkeletonLargeCell />
      <ChatLoadingSkeletonSmallCell />
      <ChatLoadingSkeletonSmallCell />
    </>
  );
}

export default ChatLoadingSkeleton;
