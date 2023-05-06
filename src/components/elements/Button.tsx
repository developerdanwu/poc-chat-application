import React, { forwardRef } from "react";
import clsx, { type ClassValue } from "clsx";

const Button = forwardRef<
  HTMLButtonElement,
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
    className?: ClassValue;
    variant?: "primary";
  }
>(function Button({ className, children, variant = "primary", ...rest }, ref) {
  return (
    <button
      ref={ref}
      className={clsx(
        "btn-primary btn",
        { "btn-primary": variant === "primary" },
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
});

export default Button;
