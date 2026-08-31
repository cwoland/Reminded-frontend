import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface HoloFrameProps {
    label?: string;
    meta?: string;
    onClose?: () => void;
    className?: string;
    children: ReactNode;
}

export function HoloFrame({ label, meta, onClose, className, children }: HoloFrameProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden rounded-[var(--radius-lg)]",
        "border border-accent/25 backdrop-blur-2xl",
        className
      )}
      style={{
        background:
          "linear-gradient(160deg, color-mix(in oklab, var(--surface-2) 82%, transparent), color-mix(in oklab, var(--bg) 88%, transparent))",
        boxShadow:
          "0 24px 60px -20px rgba(0,0,0,0.9), 0 0 40px -18px color-mix(in oklab, var(--accent) 70%, transparent), inset 0 1px 0 color-mix(in oklab, var(--accent) 18%, transparent)",
      }}
    >
        <span
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, color-mix(in oklab, var(--accent) 80%, transparent), transparent)",
        }}
      />

      <span aria-hidden className="pointer-events-none absolute left-0 top-0 h-3.5 w-3.5 border-l border-t border-accent/70" />
      <span aria-hidden className="pointer-events-none absolute right-0 top-0 h-3.5 w-3.5 border-r border-t border-accent/70" />
      <span aria-hidden className="pointer-events-none absolute bottom-0 left-0 h-3.5 w-3.5 border-b border-l border-accent/70" />
      <span aria-hidden className="pointer-events-none absolute bottom-0 right-0 h-3.5 w-3.5 border-b border-r border-accent/70" />

      {(label || onClose) && (
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-accent/15 px-4 py-2.5">
          <div className="flex min-w-0 items-baseline gap-2">
            {label && <span className="meta">{label}</span>}
            {meta && <span className="meta opacity-70">· {meta}</span>}
          </div>

          {onClose && (
            <button
              onClick={onClose}
              aria-label="Закрыть"
              className="shrink-0 rounded-[var(--radius-sm)] px-1.5 text-faint transition-colors duration-[var(--dur-hint)] hover:text-accent-strong"
            >
              ✕
            </button>
          )}
        </header>
      )}

      {children}
    </div>
  );
}