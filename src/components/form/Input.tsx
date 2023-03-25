import React from "react";
import clsx, { ClassValue } from "clsx";

const Input = ({
  className,
  ...restProps
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "className"> & {
  className?: ClassValue;
}) => {
  return (
    <input
      type="text"
      placeholder="Type here"
      className={clsx("input h-auto w-full max-w-2xl self-center", className)}
      {...restProps}
    />
  );
};

export default Input;
