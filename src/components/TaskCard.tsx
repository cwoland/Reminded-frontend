"use client";

import { useDeleteTaskMutation, useUpdateTaskMutation } from "@/lib/api/tasksApi";
import { statusActiveStyles, statusLabels, statusOrder } from "@/lib/status";
import type { Task, TaskStatus } from "@/types/api";

export function TaskCard({ task }: { task: Task }) {
  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();
  const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation();

  const isBusy = isUpdating || isDeleting;

  async function handleStatusChange(status: TaskStatus) {
    if (status === task.status) return;

    try {
      await updateTask({ id: task.id, patch: { status } }).unwrap();
    } catch {

    }
  }

  async function handleDelete() {
    if (!confirm(`Удалить задачу «${task.title}»?`)) return;

    try {
      await deleteTask(task.id).unwrap();
    } catch {

    }
  }

  return (
    <li
      className={`rounded-xl border border-line bg-surface-1 p-4 shadow-sm transition ${
        isBusy ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <h2 className="font-medium text-text">{task.title}</h2>
        <button
          onClick={handleDelete}
          disabled={isBusy}
          className="shrink-0 text-sm text-faint transition hover:text-red-600"
        >
          Удалить
        </button>
      </div>

      {task.description && (
        <p className="mt-2 text-sm text-muted">{task.description}</p>
      )}

      {task.tags.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {task.tags.map((tag) => (
            <li key={tag} className="rounded bg-surface-2 px-2 py-0.5 text-xs text-muted">
              {tag}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {statusOrder.map((status) => (
          <button
            key={status}
            onClick={() => handleStatusChange(status)}
            disabled={isBusy}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition disabled:cursor-not-allowed ${
              status === task.status
                ? statusActiveStyles[status]
                : "bg-slate-50 text-muted hover:bg-surface-2"
            }`}
          >
            {statusLabels[status]}
          </button>
        ))}
      </div>

      <p className="mt-3 text-xs text-faint">
        {new Date(task.createdAt).toLocaleString("ru-RU")}
      </p>
    </li>
  );
}