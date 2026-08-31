"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCreateTaskMutation, useDeleteProjectMutation } from "@/lib/api/tasksApi";
import { statusLabels, statusOrder } from "@/lib/status";
import { dueBucket, dueColor, formatDue } from "@/lib/deadline";
import { formatMinutes, totalMinutes } from "@/lib/duration";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { Project, Task, TaskStatus } from "@/types/api";

const statusColor: Record<TaskStatus, string> = {
  planned: "var(--status-planned)",
  in_progress: "var(--status-progress)",
  done: "var(--status-done)",
  cancelled: "var(--status-cancelled)",
};

interface ProjectPanelProps {
  project: Project | null;
  tasks: Task[];
  onClose: () => void;
  onSelectTask: (id: string) => void;
}

export function ProjectPanel({ project, tasks, onClose, onSelectTask }: ProjectPanelProps) {
  const reduce = useReducedMotion();

  const [draft, setDraft] = useState("");
  const [createTask, { isLoading: isCreating }] = useCreateTaskMutation();
  const [deleteProject, { isLoading: isDeleting }] = useDeleteProjectMutation();

  const projectTasks = project ? tasks.filter((task) => task.projectId === project.id) : [];

  const counts = statusOrder.map((status) => ({
    status,
    count: projectTasks.filter((task) => task.status === status).length,
  }));

  const spent = projectTasks.reduce((sum, task) => sum + totalMinutes(task), 0);

  async function addTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!project || draft.trim() === "") return;

    try {
      await createTask({ title: draft.trim(), projectId: project.id }).unwrap();
      setDraft("");
    } catch {
      // сообщение об ошибке появится при следующей загрузке списка
    }
  }

  async function removeProject() {
    if (!project) return;
    if (!confirm(`Удалить проект «${project.title}»? Задачи останутся, но потеряют привязку.`)) {
      return;
    }

    try {
      await deleteProject(project.id).unwrap();
      onClose();
    } catch {
      // проект останется на месте
    }
  }

  return (
    <AnimatePresence>
      {project && (
        <motion.aside
          key="project-panel"
          aria-label="Проект"
          initial={reduce ? { opacity: 0 } : { transform: "translateX(100%)", opacity: 0 }}
          animate={reduce ? { opacity: 1 } : { transform: "translateX(0%)", opacity: 1 }}
          exit={reduce ? { opacity: 0 } : { transform: "translateX(100%)", opacity: 0 }}
          transition={{ duration: 0.26, ease: [0.32, 0.72, 0, 1] }}
          className={cn(
            "fixed right-0 top-0 z-40 flex h-dvh w-full max-w-[400px] flex-col",
            "border-l border-line bg-surface-1/95 backdrop-blur-xl shadow-[var(--elev-2)]"
          )}
        >
          <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ background: project.color, boxShadow: `0 0 12px ${project.color}` }}
              />
              <div className="min-w-0">
                <p className="meta">проект</p>
                <h2 className="mt-0.5 truncate text-[15px] font-medium text-text">
                  {project.title}
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="Закрыть"
              className="shrink-0 rounded-[var(--radius-sm)] px-2 py-1 text-faint transition-colors duration-[var(--dur-hint)] hover:text-text"
            >
              ✕
            </button>
          </header>

          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
            {project.description && (
              <p className="text-sm leading-relaxed text-muted">{project.description}</p>
            )}

            <section>
              <div className="flex flex-wrap gap-1.5">
                {counts.map(({ status, count }) => (
                  <span
                    key={status}
                    className="flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-[11px] text-muted"
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: statusColor[status] }}
                    />
                    {statusLabels[status]}: <span className="tabular-nums">{count}</span>
                  </span>
                ))}
              </div>

              <p className="meta mt-2">отработано {formatMinutes(spent)}</p>
            </section>

            <section>
              <form onSubmit={addTask} className="flex gap-2">
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Новая задача проекта"
                  className="min-w-0 flex-1 rounded-[var(--radius-md)] border border-line bg-surface-2 px-3 py-2 text-sm text-text outline-none transition-colors duration-[var(--dur-hint)] focus:border-accent"
                />
                <Button variant="primary" type="submit" disabled={isCreating || draft.trim() === ""}>
                  +
                </Button>
              </form>
            </section>

            <section>
              <p className="meta mb-2">Задачи · {projectTasks.length}</p>

              {projectTasks.length === 0 ? (
                <p className="text-xs text-faint">Пока пусто</p>
              ) : (
                <ul className="space-y-1.5">
                  {projectTasks.map((task) => {
                    const bucket = dueBucket(task);

                    return (
                      <li key={task.id}>
                        <button
                          type="button"
                          onClick={() => onSelectTask(task.id)}
                          className="flex w-full items-center gap-2.5 rounded-[var(--radius-md)] border border-line bg-surface-2/60 px-3 py-2 text-left transition-colors duration-[var(--dur-hint)] hover:border-line-strong hover:bg-surface-2"
                        >
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ background: statusColor[task.status] }}
                          />
                          <span className="min-w-0 flex-1 truncate text-sm text-muted">
                            {task.title}
                          </span>

                          {task.status === "done" && task.spentMinutes > 0 && (
                            <span className="meta shrink-0">{formatMinutes(task.spentMinutes)}</span>
                          )}

                          {task.status !== "done" && task.dueDate && bucket !== "none" && (
                            <span
                              className="shrink-0 text-[11px] tabular-nums"
                              style={{ color: dueColor[bucket] ?? "var(--text-faint)" }}
                            >
                              {formatDue(task.dueDate)}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>

          <footer className="flex items-center justify-between border-t border-line px-5 py-4">
            <span className="meta">{projectTasks.length} задач</span>
            <Button variant="ghost" onClick={removeProject} disabled={isDeleting}>
              Удалить проект
            </Button>
          </footer>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}