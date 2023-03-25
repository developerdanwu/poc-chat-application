import React from "react";
import clsx from "clsx";

const Avatar = ({ alt, size = "sm" }: { alt: string; size?: "sm" | "md" }) => {
  return (
    <div className="placeholder online avatar">
      <div
        className={clsx("rounded-full bg-neutral-focus text-neutral-content", {
          "h-10 w-10": size === "sm",
          "h-12 w-12": size === "md",
        })}
      >
        <span className="text-md uppercase">{alt}</span>
      </div>
    </div>
  );
};

export default Avatar;
