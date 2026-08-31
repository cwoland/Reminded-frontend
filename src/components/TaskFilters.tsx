"use client";

import { statusLabels, statusOrder } from "@/lib/status";
import type { TaskStatus } from "@/types/api";

interface TaskFiltersProps {
  status: TaskStatus | null;
  tag: string;
  onStatusChange: (status: TaskStatus | null) => void;
  onTagChange: (tag: string) => void;
}

export function TaskFilters({ status, tag, onStatusChange, onTagChange }: TaskFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={() => onStatusChange(null)}
        className={`rounded-full px-3 py-1 text-sm transition ${
          status === null ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
        }`}
      >
        Все
      </button>

      {statusOrder.map((value) => (
        <button
          key={value}
          onClick={() => onStatusChange(value)}
          className={`rounded-full px-3 py-1 text-sm transition ${
            status === value
              ? "bg-slate-900 text-white"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          {statusLabels[value]}
        </button>
      ))}

      <input
        type="text"
        value={tag}
        onChange={(e) => onTagChange(e.target.value)}
        placeholder="Фильтр по тегу"
        className="ml-auto w-40 rounded-lg border border-slate-300 px-3 py-1 text-sm outline-none focus:border-slate-900"
      />
    </div>
  );
}