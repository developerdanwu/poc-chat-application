import React from "react";
import clsx from "clsx";

const Avatar = ({
  alt,
  size = "sm",
}: {
  alt: string;
  size?: "sm" | "md" | "xs";
}) => {
  return (
    <div className="placeholder avatar">
      <div
        className={clsx("rounded-full bg-neutral-focus text-neutral-content", {
          "h-5 w-5": size === "xs",
          "h-10 w-10": size === "sm",
          "h-12 w-12": size === "md",
        })}
      >
        <span className="select-none text-xs uppercase">{alt}</span>
      </div>
    </div>
  );
};

export default Avatar;
