"use client";

import { useEffect, useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import {
  useDeleteTaskMutation,
  useGetProjectsQuery,
  useGetTaskQuery,
  useUpdateTaskMutation,
} from "@/lib/api/tasksApi";
import { statusLabels, statusOrder } from "@/lib/status";
import { dueBucket, dueColor, dueLabel, fromDateInput, toDateInput } from "@/lib/deadline";
import { formatMinutes, fromHoursInput, toHoursInput, totalMinutes } from "@/lib/duration";
import { CommentForm } from "./CommentForm";
import { CommentList } from "./CommentList";
import { cn } from "@/lib/cn";
import type { TaskStatus } from "@/types/api";

const statusColor: Record<TaskStatus, string> = {
  planned: "var(--status-planned)",
  in_progress: "var(--status-progress)",
  done: "var(--status-done)",
  cancelled: "var(--status-cancelled)",
};

export function TaskDetails({ taskId, onDeleted }: { taskId: string; onDeleted: () => void }) {
  const { data: task } = useGetTaskQuery(taskId ?? skipToken);
  const { data: projects } = useGetProjectsQuery();

  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();
  const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation();

  const [hoursDraft, setHoursDraft] = useState<string | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!task?.startedAt) return;

    const timer = setInterval(() => setTick((value) => value + 1), 60_000);
    return () => clearInterval(timer);
  }, [task?.startedAt]);

  if (!task) {
    return <p className="px-4 py-6 text-xs text-faint">Загрузка…</p>;
  }

  const bucket = dueBucket(task);

  async function patch(changes: Parameters<typeof updateTask>[0]["patch"]) {
    try {
      await updateTask({ id: task!.id, patch: changes }).unwrap();
    } catch {
      // состояние останется прежним
    }
  }

  async function saveHours() {
    if (hoursDraft === null) return;

    const minutes = fromHoursInput(hoursDraft);
    setHoursDraft(null);

    if (minutes !== null) await patch({ spentMinutes: minutes });
  }

  const chip =
    "rounded-full border px-2.5 py-1 text-[11px] transition-[background-color,border-color,color,transform] duration-[var(--dur-press)] ease-[var(--ease-out-strong)] active:scale-[0.97] disabled:opacity-50";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <h2 className="text-[15px] font-medium leading-snug text-text">{task.title}</h2>

        <div className="flex flex-wrap gap-1.5">
          {statusOrder.map((status) => {
            const isActive = task.status === status;

            return (
              <button
                key={status}
                onClick={() => !isActive && patch({ status })}
                disabled={isUpdating}
                className={cn(
                  chip,
                  isActive
                    ? "border-transparent bg-surface-3 text-text"
                    : "border-line text-muted hover:border-accent/60 hover:text-text"
                )}
              >
                <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle" style={{ background: statusColor[status] }} />
                {statusLabels[status]}
              </button>
            );
          })}
        </div>

        <section className="rounded-[var(--radius-md)] border border-line/70 bg-surface-2/40 p-3">
          <div className="flex items-baseline justify-between gap-3">
            <span
              className="text-xl font-semibold tabular-nums"
              style={{ color: task.startedAt ? "var(--accent)" : "var(--text)" }}
            >
              {formatMinutes(totalMinutes(task))}
            </span>
            {task.startedAt && <span className="meta text-accent">идёт учёт</span>}
          </div>

          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              step="0.1"
              min="0"
              value={hoursDraft ?? toHoursInput(task.spentMinutes ?? 0)}
              onChange={(event) => setHoursDraft(event.target.value)}
              onBlur={saveHours}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
                if (event.key === "Escape") {
                  event.stopPropagation();
                  setHoursDraft(null);
                }
              }}
              disabled={isUpdating}
              className="w-20 rounded-[var(--radius-sm)] border border-line bg-surface-2 px-2 py-1 text-xs tabular-nums text-text outline-none focus:border-accent"
            />
            <span className="meta">часов</span>
          </div>
        </section>

        <section className="flex flex-wrap items-center gap-2">
          <span className="meta">срок</span>
          <input
            type="date"
            value={toDateInput(task.dueDate)}
            onChange={(event) => patch({ dueDate: fromDateInput(event.target.value) })}
            disabled={isUpdating}
            className="rounded-[var(--radius-sm)] border border-line bg-surface-2 px-2 py-1 text-xs text-text outline-none focus:border-accent [color-scheme:dark]"
          />
          {bucket !== "none" && bucket !== "later" && (
            <span className="text-[11px]" style={{ color: dueColor[bucket] ?? "var(--text-muted)" }}>
              {dueLabel[bucket]}
            </span>
          )}
        </section>

        <section>
          <p className="meta mb-1.5">проект</p>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => patch({ projectId: null })}
              disabled={isUpdating}
              className={cn(
                chip,
                !task.projectId
                  ? "border-transparent bg-surface-3 text-text"
                  : "border-line text-muted hover:border-accent/60 hover:text-text"
              )}
            >
              без проекта
            </button>

            {projects?.map((project) => (
              <button
                key={project.id}
                onClick={() => patch({ projectId: project.id })}
                disabled={isUpdating}
                className={cn(
                  chip,
                  task.projectId === project.id
                    ? "border-transparent bg-surface-3 text-text"
                    : "border-line text-muted hover:border-accent/60 hover:text-text"
                )}
              >
                <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle" style={{ background: project.color }} />
                {project.title}
              </button>
            ))}
          </div>
        </section>

        {task.description && (
          <p className="whitespace-pre-wrap text-xs leading-relaxed text-muted">{task.description}</p>
        )}

        <section>
          <p className="meta mb-1.5">комментарии · {task.comments.length}</p>
          <div className="space-y-2">
            <CommentForm taskId={task.id} />
            <CommentList taskId={task.id} comments={task.comments} />
          </div>
        </section>
      </div>

      <footer className="flex shrink-0 items-center justify-between border-t border-accent/15 px-4 py-2.5">
        <span className="meta">{new Date(task.updatedAt).toLocaleDateString("ru-RU")}</span>
        <button
          onClick={async () => {
            if (!confirm(`Удалить «${task.title}»?`)) return;
            try {
              await deleteTask(task.id).unwrap();
              onDeleted();
            } catch {
              // задача останется
            }
          }}
          disabled={isDeleting}
          className="text-xs text-faint transition-colors duration-[var(--dur-hint)] hover:text-cancelled"
        >
          удалить
        </button>
      </footer>
    </div>
  );
}