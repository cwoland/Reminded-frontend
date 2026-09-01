"use client";

export interface OrbitPosition {
    radius: number;
    angle: number;
}

export interface PositionStore {
    tasks: Record<string, OrbitPosition>;
    projects: Record<string, OrbitPosition>;
}

const STORAGE_KEY = "reminded-scene-positions";
const empty: PositionStore = { tasks: {}, projects: {} };

let store: PositionStore = empty;
let loaded = false;

const listeners = new Set<() => void>();

function emit(): void {
    for (const listener of listeners) listener();
}

function persist(): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
        //
    }
}

function ensureLoaded(): void {
  if (loaded) return;
  loaded = true;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw) as Partial<PositionStore>;
    store = { tasks: parsed.tasks ?? {}, projects: parsed.projects ?? {} };
  } catch {
    store = empty;
  }
}

export function subscribePositions(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getPositions(): PositionStore {
  ensureLoaded();
  return store;
}

export function getEmptyPositions(): PositionStore {
  return empty;
}

export function savePosition(
  kind: "tasks" | "projects",
  id: string,
  position: OrbitPosition
): void {
  ensureLoaded();

  store = { ...store, [kind]: { ...store[kind], [id]: position } };
  persist();
  emit();
}

export function clearPosition(kind: "tasks" | "projects", id: string): void {
  ensureLoaded();

  if (!store[kind][id]) return;

  const next = { ...store[kind] };
  delete next[id];

  store = { ...store, [kind]: next };
  persist();
  emit();
}

export function clearAllPositions(): void {
  store = { tasks: {}, projects: {} };
  persist();
  emit();
}