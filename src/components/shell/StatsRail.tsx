"use client";

import { statusLabels, statusOrder } from "@/lib/status";
import { dueBucket, dueColor, dueLabel, formatDue, sortByDue } from "@/lib/deadline";
import type { Project, Task } from "@/types/api";
import { formatMinutes, totalMinutes } from "@/lib/duration";

const statusColor: Record<string, string> = {
  planned: "var(--status-planned)",
  in_progress: "var(--status-progress)",
  done: "var(--status-done)",
  cancelled: "var(--status-cancelled)",
};

interface StatsRailProps {
  tasks: Task[];
  projects: Project[];
  onSelectTask?: (id: string) => void;
}

export function StatsRail({ tasks, projects, onSelectTask }: StatsRailProps) {
  const counts = statusOrder.map((status) => ({
    status,
    count: tasks.filter((task) => task.status === status).length,
  }));

  const upcoming = sortByDue(tasks);

  const buckets = {
    overdue: upcoming.filter((task) => dueBucket(task) === "overdue").length,
    today: upcoming.filter((task) => dueBucket(task) === "today").length,
    soon: upcoming.filter((task) => dueBucket(task) === "soon").length,
  };

  const total = tasks.length || 1;
  const done = counts.find((item) => item.status === "done")?.count ?? 0;
  const progress = Math.round((done / total) * 100);

  return (
    <aside className="flex flex-col gap-5">
      <section>
        <p className="meta mb-2">Статусы</p>
        <ul className="space-y-2">
          {counts.map(({ status, count }) => (
            <li key={status}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs text-muted">{statusLabels[status]}</span>
                <span className="text-xs tabular-nums text-text">{count}</span>
              </div>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full transition-[width] duration-[var(--dur-panel)] ease-[var(--ease-out-strong)]"
                  style={{
                    width: `${(count / total) * 100}%`,
                    background: statusColor[status],
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <p className="meta mb-2">Завершено</p>
        <p className="text-3xl font-semibold tabular-nums text-accent">{progress}%</p>
        <p className="meta mt-1">
          {done} из {tasks.length}
        </p>
      </section>

      <section>
        <p className="meta mb-2">Отработано</p>
        <p className="text-xl font-semibold tabular-nums text-text">
          {formatMinutes(tasks.reduce((sum, task) => sum + totalMinutes(task), 0))}
        </p>
        <p className="meta mt-1">
          по завершённым: {formatMinutes(
            tasks
              .filter((task) => task.status === "done")
              .reduce((sum, task) => sum + (task.spentMinutes ?? 0), 0)
          )}
        </p>
      </section>

      <section>
        <p className="meta mb-2">Сроки</p>

        {upcoming.length === 0 ? (
          <p className="text-xs text-faint">Дедлайнов нет</p>
        ) : (
          <>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {(["overdue", "today", "soon"] as const).map((bucket) => {
                const count = buckets[bucket];
                if (count === 0) return null;

                return (
                  <span
                    key={bucket}
                    className="rounded-full border px-2 py-0.5 text-[11px]"
                    style={{
                      borderColor: `color-mix(in oklab, ${dueColor[bucket]} 45%, transparent)`,
                      color: dueColor[bucket] ?? "var(--text-muted)",
                    }}
                  >
                    {dueLabel[bucket]}: {count}
                  </span>
                );
              })}
            </div>

            <ul className="space-y-1.5">
              {upcoming.slice(0, 4).map((task) => {
                const bucket = dueBucket(task);

                return (
                  <li key={task.id}>
                    <button
                      type="button"
                      onClick={() => onSelectTask?.(task.id)}
                      disabled={!onSelectTask}
                      className="w-full text-left transition-colors duration-[var(--dur-hint)] hover:text-text disabled:cursor-default"
                    >
                      <span className="block truncate text-xs text-muted">{task.title}</span>
                      <span
                        className="block text-[11px] tabular-nums"
                        style={{ color: dueColor[bucket] ?? "var(--text-faint)" }}
                      >
                        {formatDue(task.dueDate!)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>

      <section>
        <p className="meta mb-2">Система</p>
        <dl className="space-y-1 text-xs">
          <div className="flex justify-between gap-2">
            <dt className="text-faint">проектов</dt>
            <dd className="tabular-nums text-muted">{projects.length}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-faint">задач</dt>
            <dd className="tabular-nums text-muted">{tasks.length}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-faint">без проекта</dt>
            <dd className="tabular-nums text-muted">
              {tasks.filter((task) => !task.projectId).length}
            </dd>
          </div>
        </dl>
      </section>
    </aside>
  );
}