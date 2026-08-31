const rtf = new Intl.RelativeTimeFormat("ru", { numeric: "auto" });

export function formatRelative(iso: string): string {
  const date = new Date(iso);
  const diffMs = date.getTime() - Date.now();

  const minutes = Math.round(diffMs / 60_000);
  if (Math.abs(minutes) < 60) return rtf.format(minutes, "minute");

  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return rtf.format(hours, "hour");

  const days = Math.round(hours / 24);
  if (Math.abs(days) < 30) return rtf.format(days, "day");

  return date.toLocaleDateString("ru-RU");
}