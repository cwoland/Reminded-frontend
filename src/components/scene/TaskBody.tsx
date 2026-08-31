"use client";

import Image from "next/image";
import { cn } from "@/lib/cn";
import { dueBucket, dueColor, formatDue } from "@/lib/deadline";
import type { OrbitBody } from "@/lib/orbits";
import type { TaskStatus } from "@/types/api";
import { formatMinutes } from "@/lib/duration";

const statusGlow: Record<TaskStatus, string> = {
  planned: "var(--status-planned)",
  in_progress: "var(--status-progress)",
  done: "var(--status-done)",
  cancelled: "var(--status-cancelled)",
};

interface TaskBodyProps {
  body: OrbitBody;
  isSelected: boolean;
  isSpinning: boolean;
  isDragging: boolean;
  onSelect: (id: string) => void;
  onDragStart: (id: string, event: React.PointerEvent<HTMLButtonElement>) => void;
}

export function TaskBody({
  body,
  isSelected,
  isSpinning,
  isDragging,
  onSelect,
  onDragStart,
}: TaskBodyProps) {
  const { task, x, y, depth, scale } = body;
  const frozen = isSpinning || isDragging;
  const glow = statusGlow[task.status];

  const bucket = dueBucket(task);
  const urgent = bucket === "overdue" || bucket === "today";
  const urgentColor = dueColor[bucket];

  return (
    <button
      type="button"
      onPointerDown={(event) => onDragStart(task.id, event)}
      onClick={() => onSelect(task.id)}
      style={{
        transform: `translate3d(calc(${x}px - 50%), calc(${y}px - 50%), 0) scale(${scale})`,
        zIndex: isDragging ? 500 : Math.round((depth + 1) * 100),
        opacity: isDragging ? 1 : 0.72 + (depth + 1) * 0.14,
        transitionProperty: frozen
          ? "background-color, border-color, box-shadow, opacity"
          : "background-color, border-color, box-shadow, opacity, transform",
        transitionDuration: frozen ? "var(--dur-hint)" : "var(--dur-scene)",
        transitionTimingFunction: "var(--ease-in-out-strong)",
        boxShadow: isDragging
          ? "var(--elev-2), var(--glow)"
          : urgent && urgentColor
            ? `var(--elev-1), 0 0 0 1px color-mix(in oklab, ${urgentColor} 55%, transparent)`
            : "var(--elev-1)",
        cursor: isDragging ? "grabbing" : "grab",
      }}
      className={cn(
        "group absolute left-1/2 top-1/2 flex touch-none items-center gap-1.5",
        "rounded-full border py-1 pl-1 pr-3 text-left backdrop-blur-[6px]",
        isSelected
          ? "border-accent/70 bg-surface-1/95 text-text"
          : "border-line-strong/80 bg-surface-1/90 text-muted hover:border-accent/60 hover:bg-surface-2 hover:text-text"
      )}
    >
      <Image
        src={`/icons/${task.status}.png`}
        alt=""
        width={26}
        height={26}
        className="shrink-0 select-none transition-[filter,transform] duration-[var(--dur-menu)] ease-[var(--ease-out-strong)] group-hover:scale-110"
        style={{
          filter: `drop-shadow(0 0 6px color-mix(in oklab, ${glow} 70%, transparent))`,
        }}
      />
              {task.status === "done" && task.spentMinutes > 0 ? (
          <span className="text-[10px] leading-none tabular-nums text-faint">
            {formatMinutes(task.spentMinutes)}
          </span>
        ) : (
          task.dueDate &&
          bucket !== "none" && (
            <span
              className="text-[10px] leading-none tabular-nums"
              style={{ color: urgentColor ?? "var(--text-faint)" }}
            >
              {formatDue(task.dueDate)}
            </span>
          )
        )}
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="max-w-[168px] truncate text-[13px] leading-none">{task.title}</span>
        {task.dueDate && bucket !== "none" && (
          <span
            className="text-[10px] leading-none tabular-nums"
            style={{ color: urgentColor ?? "var(--text-faint)" }}
          >
            {formatDue(task.dueDate)}
          </span>
        )}
      </span>
    </button>
  );
}
