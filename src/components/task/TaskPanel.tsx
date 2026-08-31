"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { skipToken } from "@reduxjs/toolkit/query";
import { useDeleteTaskMutation, useGetTaskQuery, useUpdateTaskMutation, useGetProjectsQuery } from "@/lib/api/tasksApi";
import { statusLabels, statusOrder } from "@/lib/status";
import { Button } from "@/components/ui/Button";
import { CommentForm } from "./CommentForm";
import { CommentList } from "./CommentList";
import { cn } from "@/lib/cn";
import { formatMinutes, fromHoursInput, toHoursInput, totalMinutes } from "@/lib/duration";
import { dueBucket, dueColor, dueLabel, fromDateInput, toDateInput } from "@/lib/deadline";
import type { TaskStatus } from "@/types/api";

const dotColor: Record<TaskStatus, string> = {
  planned: "var(--status-planned)",
  in_progress: "var(--status-progress)",
  done: "var(--status-done)",
  cancelled: "var(--status-cancelled)",
};

interface TaskPanelProps {
  taskId: string | null;
  onClose: () => void;
}

export function TaskPanel({ taskId, onClose }: TaskPanelProps) {
  const reduce = useReducedMotion();

  const { data: task, isFetching } = useGetTaskQuery(taskId ?? skipToken);
  const { data: projects } = useGetProjectsQuery();
  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();
  const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation();
  const [hoursDraft, setHoursDraft] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!taskId) return;

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [taskId, onClose]);

  useEffect(() => {
    if (!task?.startedAt) return;

    const timer = setInterval(() => setTick((value) => value + 1), 60_000);
    return () => clearInterval(timer);
  }, [task?.startedAt]);

  async function saveHours() {
    if (!task || hoursDraft === null) return;

    const minutes = fromHoursInput(hoursDraft);
    if (minutes === null) {
      setHoursDraft(null);
      return;
    }

    try {
      await updateTask({ id: task.id, patch: { spentMinutes: minutes } }).unwrap();
    } finally {
      setHoursDraft(null);
    }
  }

  async function changeDueDate(value: string) {
    if (!task) return;

    const dueDate = fromDateInput(value);
    if ((task.dueDate ?? null) === dueDate) return;

    try {
      await updateTask({ id: task.id, patch: { dueDate } }).unwrap();
    } catch {
      // срок останется прежним
    }
  }

  async function changeProject(projectId: string | null) {
    if (!task || (task.projectId ?? null) === projectId) return;

    try {
      await updateTask({ id: task.id, patch: { projectId } }).unwrap();
    } catch {
      
    }
  }

  async function changeStatus(status: TaskStatus) {
    if (!task || status === task.status) return;

    try {
      await updateTask({ id: task.id, patch: { status } }).unwrap();
    } catch {
      // список и сцена останутся в прежнем состоянии
    }
  }

  async function remove() {
    if (!task) return;

    try {
      await deleteTask(task.id).unwrap();
      onClose();
    } catch {
      // задача останется на месте
    }
  }

  return (
    <AnimatePresence>
      {taskId && (
        <motion.aside
          key="task-panel"
          aria-label="Карточка задачи"
          initial={reduce ? { opacity: 0 } : { transform: "translateX(100%)", opacity: 0 }}
          animate={reduce ? { opacity: 1 } : { transform: "translateX(0%)", opacity: 1 }}
          exit={reduce ? { opacity: 0 } : { transform: "translateX(100%)", opacity: 0 }}
          transition={{ duration: 0.26, ease: [0.32, 0.72, 0, 1] }}
          className={cn(
            "fixed right-0 top-0 z-50 flex h-dvh w-full max-w-[400px] flex-col",
            "border-l border-line bg-surface-1/95 backdrop-blur-xl",
            "shadow-[var(--elev-2)]"
          )}
        >
          <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
            <div className="min-w-0">
              <p className="meta">задача</p>
              <h2 className="mt-1 truncate text-[15px] font-medium text-text">
                {task?.title ?? "…"}
              </h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Закрыть"
              className="shrink-0 rounded-[var(--radius-sm)] px-2 py-1 text-faint transition-colors duration-[var(--dur-hint)] hover:text-text"
            >
              ✕
            </button>
          </header>

          <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
            <section>
              <p className="meta mb-2">Статус</p>
              <div className="flex flex-wrap gap-1.5">
                {statusOrder.map((status) => {
                  const isActive = task?.status === status;

                  return (
                    <button
                      key={status}
                      onClick={() => changeStatus(status)}
                      disabled={isUpdating || !task}
                      className={cn(
                        "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs",
                        "transition-[background-color,border-color,color,transform] duration-[var(--dur-press)] ease-[var(--ease-out-strong)]",
                        "active:scale-[0.97] disabled:opacity-50",
                        isActive
                          ? "border-transparent bg-surface-3 text-text"
                          : "border-line text-muted hover:border-line-strong hover:text-text"
                      )}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: dotColor[status] }}
                      />
                      {statusLabels[status]}
                    </button>
                  );
                })}
              </div>
            </section>

              {task && (
              <section>
                <p className="meta mb-2">Время</p>

                <div className="rounded-[var(--radius-md)] border border-line bg-surface-2/60 p-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <span
                      className="text-2xl font-semibold tabular-nums"
                      style={{ color: task.startedAt ? "var(--accent)" : "var(--text)" }}
                    >
                      {formatMinutes(totalMinutes(task, Date.now() + tick * 0))}
                    </span>

                    {task.startedAt && (
                      <span className="meta" style={{ color: "var(--accent)" }}>
                        идёт учёт
                      </span>
                    )}

                    {task.status === "done" && task.completedAt && (
                      <span className="meta">
                        завершено {new Date(task.completedAt).toLocaleDateString("ru-RU")}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={hoursDraft ?? toHoursInput(task.spentMinutes ?? 0)}
                      onChange={(event) => setHoursDraft(event.target.value)}
                      onBlur={saveHours}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") event.currentTarget.blur();
                        if (event.key === "Escape") setHoursDraft(null);
                      }}
                      disabled={isUpdating}
                      className="w-20 rounded-[var(--radius-md)] border border-line bg-surface-2 px-2 py-1 text-sm tabular-nums text-text outline-none transition-colors duration-[var(--dur-hint)] focus:border-accent disabled:opacity-50"
                    />
                    <span className="meta">часов</span>
                  </div>
                </div>
              </section>
            )}

            <section>
              <p className="meta mb-2">Проект</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => changeProject(null)}
                  disabled={isUpdating || !task}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs",
                    "transition-[background-color,border-color,color,transform] duration-[var(--dur-press)] ease-[var(--ease-out-strong)]",
                    "active:scale-[0.97] disabled:opacity-50",
                    !task?.projectId
                      ? "border-transparent bg-surface-3 text-text"
                      : "border-line text-muted hover:border-line-strong hover:text-text"
                  )}
                >
                  Без проекта
                </button>

                {projects?.map((project) => {
                  const isActive = task?.projectId === project.id;

                  return (
                    <button
                      key={project.id}
                      onClick={() => changeProject(project.id)}
                      disabled={isUpdating || !task}
                      className={cn(
                        "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs",
                        "transition-[background-color,border-color,color,transform] duration-[var(--dur-press)] ease-[var(--ease-out-strong)]",
                        "active:scale-[0.97] disabled:opacity-50",
                        isActive
                          ? "border-transparent bg-surface-3 text-text"
                          : "border-line text-muted hover:border-line-strong hover:text-text"
                      )}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: project.color }}
                      />
                      {project.title}
                    </button>
                  );
                })}
              </div>
            </section>

            {task && (
              <section>
                <p className="meta mb-2">Срок</p>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={toDateInput(task.dueDate)}
                    onChange={(event) => changeDueDate(event.target.value)}
                    disabled={isUpdating}
                    className="rounded-[var(--radius-md)] border border-line bg-surface-2 px-3 py-1.5 text-xs text-text outline-none transition-colors duration-[var(--dur-hint)] focus:border-accent disabled:opacity-50 [color-scheme:dark]"
                  />

                  {task.dueDate && (
                    <button
                      onClick={() => changeDueDate("")}
                      disabled={isUpdating}
                      className="rounded-[var(--radius-md)] border border-line px-2.5 py-1.5 text-xs text-faint transition-colors duration-[var(--dur-hint)] hover:border-line-strong hover:text-text disabled:opacity-50"
                    >
                      убрать
                    </button>
                  )}

                  {(() => {
                    const bucket = dueBucket(task);
                    if (bucket === "none" || bucket === "later") return null;

                    return (
                      <span
                        className="text-xs"
                        style={{ color: dueColor[bucket] ?? "var(--text-muted)" }}
                      >
                        {dueLabel[bucket]}
                      </span>
                    );
                  })()}
                </div>
              </section>
            )}

            {task?.description && (
              <section>
                <p className="meta mb-2">Описание</p>
                <p className="text-sm leading-relaxed text-muted">{task.description}</p>
              </section>
            )}

            {task && task.tags.length > 0 && (
              <section>
                <p className="meta mb-2">Теги</p>
                <ul className="flex flex-wrap gap-1.5">
                  {task.tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-[var(--radius-sm)] bg-surface-2 px-2 py-0.5 text-xs text-muted"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {task && (
              <section>
                <p className="meta mb-2">Хронология</p>
                <dl className="space-y-1 text-xs text-faint">
                  <div className="flex justify-between gap-4">
                    <dt>создана</dt>
                    <dd className="tabular-nums text-muted">
                      {new Date(task.createdAt).toLocaleString("ru-RU")}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>обновлена</dt>
                    <dd className="tabular-nums text-muted">
                      {new Date(task.updatedAt).toLocaleString("ru-RU")}
                    </dd>
                  </div>
                </dl>
              </section>
            )}

            {task && (
              <section>
                <p className="meta mb-2">Комментарии · {task.comments.length}</p>
                <div className="space-y-3">
                  <CommentForm taskId={task.id} />
                  <CommentList taskId={task.id} comments={task.comments} />
                </div>
              </section>
            )}
          </div>

          <footer className="flex items-center justify-between border-t border-line px-5 py-4">
            <span className="meta">{isFetching ? "обновление…" : "синхронизировано"}</span>
            <Button variant="ghost" onClick={remove} disabled={isDeleting || !task}>
              Удалить
            </Button>
          </footer>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}