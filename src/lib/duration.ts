import type { Task } from "@/types/api";

export function totalMinutes(task: Task, now: number = Date.now()): number {
  const base = task.spentMinutes ?? 0;
  if (!task.startedAt) return base;

  const started = new Date(task.startedAt).getTime();
  if (Number.isNaN(started)) return base;

  return base + Math.max(0, Math.floor((now - started) / 60_000));
}

export function formatMinutes(minutes: number): string {
  if (minutes <= 0) return "0 мин";

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (hours === 0) return `${rest} мин`;
  if (rest === 0) return `${hours} ч`;

  return `${hours} ч ${rest} мин`;
}

export function toHoursInput(minutes: number): string {
  return (Math.round((minutes / 60) * 10) / 10).toString();
}

export function fromHoursInput(value: string): number | null {
  const hours = Number(value.replace(",", "."));
  if (!Number.isFinite(hours) || hours < 0) return null;

  return Math.round(hours * 60);
}