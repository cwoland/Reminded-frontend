import type { Project, Task } from "@/types/api";
import { commands, type Intent } from "./commands";

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,!?]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseIntent(variants: string[]): Intent | null {
  for (const variant of variants) {
    const text = normalize(variant);

    for (const command of commands) {
      for (const pattern of command.patterns) {
        const match = text.match(pattern);
        if (!match) continue;

        const intent = command.build(match);
        if (intent) return intent;
      }
    }
  }

  return null;
}

/** Расстояние Левенштейна — сколько правок нужно, чтобы получить из a строку b */
function distance(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(0));

  for (let i = 0; i < rows; i++) matrix[i][0] = i;
  for (let j = 0; j < cols; j++) matrix[0][j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[rows - 1][cols - 1];
}

function bestMatch<T>(query: string, items: T[], titleOf: (item: T) => string): T | null {
  const needle = normalize(query);
  if (!needle) return null;

  const exact = items.find((item) => normalize(titleOf(item)) === needle);
  if (exact) return exact;

  const partial = items.filter((item) => normalize(titleOf(item)).includes(needle));
  if (partial.length === 1) return partial[0];

  let best: { item: T; score: number } | null = null;

  for (const item of items) {
    const title = normalize(titleOf(item));
    const score = distance(needle, title) / Math.max(needle.length, title.length);

    if (score < 0.4 && (!best || score < best.score)) {
      best = { item, score };
    }
  }

  return best?.item ?? null;
}

export function findProject(query: string, projects: Project[]): Project | null {
  return bestMatch(query, projects, (project) => project.title);
}

export function findTask(query: string, tasks: Task[]): Task | null {
  return bestMatch(query, tasks, (task) => task.title);
}