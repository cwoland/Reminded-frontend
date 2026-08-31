"use client";

import { cn } from "@/lib/cn";
import type { OrbitBody } from "@/lib/orbits";

const dotColor: Record<string, string> = {
  planned: "var(--status-planned)",
  in_progress: "var(--status-progress)",
  done: "var(--status-done)",
  cancelled: "var(--status-cancelled)",
};

interface TaskBodyProps {
  body: OrbitBody;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function TaskBody({ body, isSelected, onSelect }: TaskBodyProps) {
  const { task, x, y, depth, scale } = body;

  return (
    <button
      type="button"
      onClick={() => onSelect(task.id)}
      style={{
        transform: `translate3d(calc(${x}px - 50%), calc(${y}px - 50%), 0) scale(${scale})`,
        zIndex: Math.round((depth + 1) * 100),
        opacity: 0.55 + (depth + 1) * 0.22,
      }}
      className={cn(
        "group absolute left-1/2 top-1/2 flex items-center gap-2",
        "rounded-full border py-1.5 pl-2 pr-3 text-left",
        "transition-[background-color,border-color,box-shadow,opacity] duration-[var(--dur-hint)] ease-[var(--ease-out-strong)]",
        isSelected
          ? "border-transparent bg-surface-3 text-text shadow-[var(--glow)]"
          : "border-line bg-surface-2/90 text-muted hover:border-line-strong hover:bg-surface-3 hover:text-text"
      )}
    >
        <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ background: dotColor[task.status] }}
      />
      <span className="max-w-[168px] truncate text-[13px] leading-none">{task.title}</span>
    </button>
  );
}