import type { ReactNode } from "react";

interface HudFrameProps {
  label: string;
  meta?: string;
  children: ReactNode;
}

export function HudFrame({ label, meta, children }: HudFrameProps) {
  return (
    <div className="relative rounded-[var(--radius-lg)] border border-line/60">
      <span className="absolute -top-2 left-4 bg-bg px-2">
        <span className="meta">{label}</span>
      </span>

      {meta && (
        <span className="absolute -bottom-2 right-4 bg-bg px-2">
          <span className="meta">{meta}</span>
        </span>
      )}

      <span className="pointer-events-none absolute -left-px -top-px h-4 w-4 border-l-2 border-t-2 border-accent/70" />
      <span className="pointer-events-none absolute -right-px -top-px h-4 w-4 border-r-2 border-t-2 border-accent/70" />
      <span className="pointer-events-none absolute -bottom-px -left-px h-4 w-4 border-b-2 border-l-2 border-accent/70" />
      <span className="pointer-events-none absolute -bottom-px -right-px h-4 w-4 border-b-2 border-r-2 border-accent/70" />

      {children}
    </div>
  );
}