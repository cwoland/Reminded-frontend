import type { TaskStatus } from "@/types/api";

export const statusOrder: TaskStatus[] = ["planned", "in_progress", "done", "cancelled"];

export const statusLabels: Record<TaskStatus, string> = {
    planned: "Запланировано",
    in_progress: "В работе",
    done: "Готово",
    cancelled: "Отменено",
};

export const statusStyles: Record<TaskStatus, string> = {
    planned: "bg-slate-100 text-slate-700",
    in_progress: "bg-blue-100 text-blue-700",
    done: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
};

export const statusActiveStyles: Record<TaskStatus, string> = {
  planned: "bg-slate-700 text-white",
  in_progress: "bg-blue-600 text-white",
  done: "bg-green-600 text-white",
  cancelled: "bg-red-600 text-white",
};