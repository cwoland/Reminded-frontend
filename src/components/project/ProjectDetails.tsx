"use client";

import { useState } from "react";
import {
  useCreateTaskMutation,
  useDeleteProjectMutation,
  useUpdateProjectMutation,
} from "@/lib/api/tasksApi";
import { statusLabels, statusOrder } from "@/lib/status";
import { dueBucket, dueColor, formatDue } from "@/lib/deadline";
import { formatMinutes, totalMinutes } from "@/lib/duration";
import { Button } from "@/components/ui/Button";
import type { Project, Task, TaskStatus } from "@/types/api";

const palette = ["#ff9e2c", "#35d0b5", "#e5484d", "#c58af9", "#4db8ff", "#8a8172"];

const statusColor: Record<TaskStatus, string> = {
  planned: "var(--status-planned)",
  in_progress: "var(--status-progress)",
  done: "var(--status-done)",
  cancelled: "var(--status-cancelled)",
};

interface ProjectDetailsProps {
  project: Project;
  tasks: Task[];
  onSelectTask: (id: string) => void;
  onDeleted: () => void;
}

export function ProjectDetails({ project, tasks, onSelectTask, onDeleted }: ProjectDetailsProps) {
  const [draft, setDraft] = useState("");
  const [titleDraft, setTitleDraft] = useState<string | null>(null);

  const [createTask, { isLoading: isCreating }] = useCreateTaskMutation();
  const [updateProject] = useUpdateProjectMutation();
  const [deleteProject, { isLoading: isDeleting }] = useDeleteProjectMutation();

  const projectTasks = tasks.filter((task) => task.projectId === project.id);
  const spent = projectTasks.reduce((sum, task) => sum + totalMinutes(task), 0);

  async function addTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (draft.trim() === "") return;

    try {
      await createTask({ title: draft.trim(), projectId: project.id }).unwrap();
      setDraft("");
    } catch {
      // список не изменится
    }
  }

  async function saveTitle() {
    const next = titleDraft?.trim();
    setTitleDraft(null);

    if (!next || next === project.title) return;

    try {
      await updateProject({ id: project.id, patch: { title: next } }).unwrap();
    } catch {
      // название останется прежним
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
        <div className="flex items-center gap-3">
          <span
            className="h-3.5 w-3.5 shrink-0 rounded-full"
            style={{ background: project.color, boxShadow: `0 0 14px ${project.color}` }}
          />
          <input
            value={titleDraft ?? project.title}
            onChange={(event) => setTitleDraft(event.target.value)}
            onBlur={saveTitle}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
              if (event.key === "Escape") {
                event.stopPropagation();
                setTitleDraft(null);
              }
            }}
            className="min-w-0 flex-1 rounded-[var(--radius-sm)] border border-transparent bg-transparent px-2 py-1 text-lg font-medium text-text outline-none transition-colors duration-[var(--dur-hint)] hover:border-line focus:border-accent"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1.5">
            {palette.map((color) => (
              <button
                key={color}
                onClick={() => updateProject({ id: project.id, patch: { color } })}
                aria-label={`Цвет ${color}`}
                className="h-5 w-5 rounded-full border-2 transition-transform duration-[var(--dur-press)] ease-[var(--ease-out-strong)] active:scale-90"
                style={{
                  background: color,
                  borderColor: project.color === color ? "var(--text)" : "transparent",
                }}
              />
            ))}
          </div>

          <span className="meta ml-auto">отработано {formatMinutes(spent)}</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {statusOrder.map((status) => {
            const count = projectTasks.filter((task) => task.status === status).length;

            return (
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
            );
          })}
        </div>

        <form onSubmit={addTask} className="flex gap-2">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Новая задача проекта"
            className="min-w-0 flex-1 rounded-[var(--radius-md)] border border-line bg-surface-2 px-3 py-2 text-sm text-text outline-none transition-colors duration-[var(--dur-hint)] focus:border-accent"
          />
          <Button variant="primary" type="submit" disabled={isCreating || draft.trim() === ""}>
            Добавить
          </Button>
        </form>

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
                      className="flex w-full items-center gap-2.5 rounded-[var(--radius-md)] border border-line bg-surface-2/50 px-3 py-2 text-left transition-colors duration-[var(--dur-hint)] hover:border-accent/50 hover:bg-surface-2"
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

      <footer className="flex shrink-0 items-center justify-between border-t border-accent/15 px-5 py-3">
        <span className="meta">создан {new Date(project.createdAt).toLocaleDateString("ru-RU")}</span>
        <button
          onClick={async () => {
            if (!confirm(`Удалить «${project.title}»? Задачи останутся без проекта.`)) return;
            try {
              await deleteProject(project.id).unwrap();
              onDeleted();
            } catch {
              // проект останется
            }
          }}
          disabled={isDeleting}
          className="text-xs text-faint transition-colors duration-[var(--dur-hint)] hover:text-cancelled"
        >
          удалить проект
        </button>
      </footer>
    </div>
  );
}