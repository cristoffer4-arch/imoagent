"use client";

import type { InputHTMLAttributes, ReactNode } from "react";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type InputProps = {
  label?: string;
  error?: string;
  helper?: string;
  icon?: ReactNode;
} & InputHTMLAttributes<HTMLInputElement>;

export function Input({
  label,
  error,
  helper,
  icon,
  className,
  ...props
}: InputProps) {
  return (
    <label className="flex w-full flex-col gap-1 text-sm text-gray-800">
      {label && <span className="font-semibold text-gray-900">{label}</span>}
      <div
        className={cn(
          "flex items-center gap-2 rounded-xl border bg-white px-3 py-2 shadow-sm transition focus-within:border-[#E91E63] focus-within:ring-2 focus-within:ring-pink-100",
          error ? "border-red-400" : "border-gray-200",
        )}
      >
        {icon && <span className="text-gray-500">{icon}</span>}
        <input
          className={cn(
            "w-full bg-transparent outline-none placeholder:text-gray-400",
            className,
          )}
          {...props}
        />
      </div>
      {helper && !error && <span className="text-xs text-gray-500">{helper}</span>}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </label>
  );
}
