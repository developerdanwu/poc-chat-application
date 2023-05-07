import React, { forwardRef } from "react";
import clsx, { type ClassValue } from "clsx";

const Input = forwardRef<
  HTMLInputElement,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "className"> & {
    className?: ClassValue;
  }
>(function Input({ className, ...restProps }, ref) {
  return (
    <input
      ref={ref}
      type="text"
      placeholder="Type here"
      className={clsx(
        "input input-xs h-auto w-full rounded-sm py-2",
        className
      )}
      {...restProps}
    />
  );
});

export default Input;
