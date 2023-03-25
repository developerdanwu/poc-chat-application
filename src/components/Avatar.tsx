import React from "react";

const Avatar = ({ alt }: { alt: string }) => {
  return (
    <div className="placeholder online avatar">
      <div className="h-10 w-10 rounded-full bg-neutral-focus text-neutral-content">
        <span className="text-md">{alt}</span>
      </div>
    </div>
  );
};

export default Avatar;
