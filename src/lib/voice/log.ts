export interface VoiceLogEntry {
  id: string;
  at: number;
  heard: string;
  /** Что система поняла: id команды или null, если не разобрала */
  command: string | null;
  reply: string;
}

const MAX_ENTRIES = 30;

let entries: VoiceLogEntry[] = [];
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

export function subscribeToVoiceLog(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getVoiceLog(): VoiceLogEntry[] {
  return entries;
}

export function getEmptyVoiceLog(): VoiceLogEntry[] {
  return [];
}

export function addVoiceLogEntry(entry: Omit<VoiceLogEntry, "id" | "at">): void {
  const next: VoiceLogEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: Date.now(),
  };

  entries = [next, ...entries].slice(0, MAX_ENTRIES);
  emit();
}

export function clearVoiceLog(): void {
  entries = [];
  emit();
}
