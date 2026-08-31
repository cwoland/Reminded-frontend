import type { Task } from "@/types/api";

export type DueBucket = "none" | "overdue" | "today" | "soon" | "later";

const DAY = 24 * 60 * 60 * 1000;

/**
 * Насколько горит задача. Закрытые задачи не горят никогда,
 * даже если срок давно прошёл.
 */
export function dueBucket(task: Task, now: number = Date.now()): DueBucket {
  if (!task.dueDate) return "none";
  if (task.status === "done" || task.status === "cancelled") return "none";

  const due = new Date(task.dueDate).getTime();
  if (Number.isNaN(due)) return "none";

  if (due < now) return "overdue";
  if (due - now < DAY) return "today";
  if (due - now < 7 * DAY) return "soon";

  return "later";
}

export const dueColor: Record<DueBucket, string | null> = {
  none: null,
  overdue: "var(--status-cancelled)",
  today: "var(--accent)",
  soon: "var(--status-planned)",
  later: null,
};

export const dueLabel: Record<DueBucket, string> = {
  none: "без срока",
  overdue: "просрочено",
  today: "сегодня",
  soon: "на этой неделе",
  later: "позже",
};

/** ISO → значение для <input type="date"> в локальной зоне */
export function toDateInput(iso?: string | null): string {
  if (!iso) return "";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (value: number) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Значение <input type="date"> → ISO. Срок ставим на конец выбранного дня. */
export function fromDateInput(value: string): string | null {
  if (!value) return null;

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day, 23, 59, 0, 0).toISOString();
}

/** Короткая подпись срока: «до 4 сент.» */
export function formatDue(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  return `до ${date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}`;
}

export function sortByDue(tasks: Task[]): Task[] {
  return tasks
    .filter((task) => dueBucket(task) !== "none")
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
}
