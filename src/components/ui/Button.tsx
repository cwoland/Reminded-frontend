"use client";

import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "outline" | "ghost";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-[#04121c] hover:bg-accent-strong shadow-[var(--elev-1)]",
  outline:
    "border border-line-strong bg-surface-2 text-text hover:border-accent hover:text-accent-strong",
  ghost: "text-muted hover:text-text hover:bg-surface-2",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = "outline", className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] px-3.5 py-2",
        "text-sm font-medium select-none",
        "transition-[transform,background-color,border-color,color,box-shadow]",
        "duration-[var(--dur-press)] ease-[var(--ease-out-strong)]",
        "active:scale-[0.97]",
        "disabled:pointer-events-none disabled:opacity-45",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}