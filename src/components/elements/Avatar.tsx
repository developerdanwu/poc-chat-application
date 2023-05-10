import React from "react";
import { cn } from "@/utils/utils";

const Avatar = ({
  alt,
  size = "sm",
}: {
  alt: string;
  size?: "sm" | "md" | "xs" | "lg";
}) => {
  return (
    <div className="placeholder avatar">
      <div
        className={cn("rounded-full bg-neutral-focus text-neutral-content", {
          "h-5 w-5": size === "xs",
          "h-10 w-10": size === "sm",
          "h-12 w-12": size === "md",
          "h-16 w-16": size === "lg",
        })}
      >
        <span
          className={cn("select-none text-xs uppercase", {
            "text-md": size === "lg",
          })}
        >
          {alt}
        </span>
      </div>
    </div>
  );
};

export default Avatar;
