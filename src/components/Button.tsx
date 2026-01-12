"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const baseStyles =
  "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60 disabled:cursor-not-allowed";

const variants: Record<string, string> = {
  primary:
    "bg-gradient-to-r from-[#E91E63] to-[#9C27B0] text-white shadow-md hover:shadow-lg hover:scale-[1.01] focus-visible:outline-[#E91E63]",
  secondary:
    "border border-pink-200 text-[#E91E63] bg-white hover:bg-pink-50 focus-visible:outline-[#E91E63]",
  ghost: "text-gray-700 hover:bg-gray-100 focus-visible:outline-gray-300",
};

type ButtonProps = {
  variant?: keyof typeof variants;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  variant = "primary",
  leftIcon,
  rightIcon,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button className={cn(baseStyles, variants[variant], className)} {...props}>
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
}
