import { commands, systemReplies, type CommandId } from "./commands";

const STORAGE_KEY = "reminded-voice-replies";

export const defaultReplies: Record<CommandId, string> = Object.fromEntries([
  ...commands.map((command) => [command.id, command.defaultReply]),
  ...systemReplies.map((reply) => [reply.id, reply.defaultReply]),
]) as Record<CommandId, string>;

export function loadReplies(): Record<CommandId, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultReplies };

    return { ...defaultReplies, ...(JSON.parse(raw) as Partial<Record<CommandId, string>>) };
  } catch {
    return { ...defaultReplies };
  }
}

export function saveReply(id: CommandId, template: string): void {
  try {
    const current = loadReplies();
    const next = { ...current, [id]: template };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // приватный режим — правка живёт до перезагрузки
  }
}

export function resetReplies(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ничего не делаем
  }
}

export function renderReply(
  template: string,
  values: Record<string, string | undefined>
): string {
  return template
    .replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "")
    .replace(/\s{2,}/g, " ")
    .trim();
}