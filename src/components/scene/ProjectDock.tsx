"use client";

import { cn } from "@/lib/cn";

export interface DockTarget {
  id: string | null;
  title: string;
  color: string;
  total: number;
}

interface ProjectDockProps {
  targets: DockTarget[];
  isDragging: boolean;
  activeId: string | null | undefined;
  onNavigate: (id: string | null) => void;
  registerNode: (key: string, node: HTMLElement | null) => void;
}

export function ProjectDock({
  targets,
  isDragging,
  activeId,
  onNavigate,
  registerNode,
}: ProjectDockProps) {
  if (targets.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center">
      <ul className="pointer-events-auto flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full border border-line bg-surface-1/85 px-3 py-2 backdrop-blur-md">
        {targets.map((target) => {
          const key = target.id ?? "orphans";
          const isActive = isDragging && activeId !== undefined && activeId === target.id;

          return (
            <li key={key}>
              <button
                ref={(node) => registerNode(key, node)}
                type="button"
                onClick={() => onNavigate(target.id)}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs",
                  "transition-[transform,border-color,background-color,color,box-shadow]",
                  "duration-[var(--dur-menu)] ease-[var(--ease-out-strong)]",
                  isActive
                    ? "scale-[1.08] border-accent bg-surface-3 text-text"
                    : isDragging
                      ? "scale-[1.03] border-line-strong text-muted"
                      : "border-line text-faint hover:border-line-strong hover:text-text"
                )}
                style={isActive ? { boxShadow: "var(--glow)" } : undefined}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: target.color }}
                />
                <span className="max-w-[130px] truncate">{target.title}</span>
                <span className="meta">{target.total}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}