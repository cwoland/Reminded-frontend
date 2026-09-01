import type { TaskStatus } from "@/types/api";

export type CommandId =
  | "show_projects"
  | "open_project"
  | "go_back"
  | "create_task"
  | "open_task"
  | "set_status"
  | "project_not_found"
  | "task_not_found"
  | "unknown";

export type Intent =
  | { kind: "show_projects" }
  | { kind: "open_project"; query: string }
  | { kind: "go_back" }
  | { kind: "create_task"; title: string; projectQuery?: string }
  | { kind: "open_task"; query: string }
  | { kind: "set_status"; query: string; status: TaskStatus };

export interface CommandSpec {
  id: CommandId;
  title: string;
  examples: string[];
  patterns: RegExp[];
  build: (match: RegExpMatchArray) => Intent | null;
  defaultReply: string;
  placeholders: string[];
}

const statusWords: { re: RegExp; status: TaskStatus }[] = [
  { re: /готов|заверш|сделан/i, status: "done" },
  { re: /в\s*работ|работаю|начал/i, status: "in_progress" },
  { re: /отмен|отклон/i, status: "cancelled" },
  { re: /заплан|отлож/i, status: "planned" },
];

export const commands: CommandSpec[] = [
  {
    id: "show_projects",
    title: "Список проектов",
    examples: ["проекты", "все проекты"],
    patterns: [/^(?:все\s+)?проект(?:ы|ов)$/i],
    build: () => ({ kind: "show_projects" }),
    defaultReply: "Проекты",
    placeholders: [],
  },
  {
    id: "go_back",
    title: "Вернуться в систему",
    examples: ["назад", "вернись", "система"],
    patterns: [/^(?:назад|наверх|выйди|система|вернись)$/i],
    build: () => ({ kind: "go_back" }),
    defaultReply: "Возвращаюсь",
    placeholders: [],
  },
  {
    id: "open_project",
    title: "Открыть проект",
    examples: ["открой проект работа", "покажи проект дом"],
    patterns: [/^(?:открой|покажи|перейди\s+в)\s+проект\s+(.+)$/i],
    build: (m) => ({ kind: "open_project", query: m[1] }),
    defaultReply: "Проект {name}",
    placeholders: ["{name}"],
  },
  {
    id: "create_task",
    title: "Создать задачу",
    examples: ["добавь задачу купить кофе", "создай задачу отчёт в проект работа"],
    patterns: [
      /^(?:добавь|создай|новая?)\s+(?:новую\s+)?задач[ауи]\s+(.+?)(?:\s+в\s+проект\s+(.+))?$/i,
    ],
    build: (m) => ({ kind: "create_task", title: m[1], projectQuery: m[2] }),
    defaultReply: "Добавил: {name}",
    placeholders: ["{name}", "{project}"],
  },
  {
    id: "set_status",
    title: "Сменить статус задачи",
    examples: ["отметь отчёт готово", "переведи созвон в работу"],
    patterns: [
      /^(?:отметь|поставь|переведи)\s+(?:задачу\s+)?(.+?)\s+(?:как\s+|в\s+)?(готов\w*|в\s*работ\w*|отмен\w*|заплан\w*)$/i,
    ],
    build: (m) => {
      const found = statusWords.find((entry) => entry.re.test(m[2]));
      return found ? { kind: "set_status", query: m[1], status: found.status } : null;
    },
    defaultReply: "{name} — {status}",
    placeholders: ["{name}", "{status}"],
  },
  {
    id: "open_task",
    title: "Открыть задачу",
    examples: ["открой задачу отчёт", "найди задачу созвон"],
    patterns: [/^(?:открой|покажи|найди)\s+задачу\s+(.+)$/i],
    build: (m) => ({ kind: "open_task", query: m[1] }),
    defaultReply: "Задача {name}",
    placeholders: ["{name}"],
  },
];

export const systemReplies: Pick<CommandSpec, "id" | "title" | "defaultReply" | "placeholders">[] = [
  {
    id: "project_not_found",
    title: "Проект не найден",
    defaultReply: "Проект {name} не найден",
    placeholders: ["{name}"],
  },
  {
    id: "task_not_found",
    title: "Задача не найдена",
    defaultReply: "Задача {name} не найдена",
    placeholders: ["{name}"],
  },
  {
    id: "unknown",
    title: "Команда не распознана",
    defaultReply: "Не понял команду",
    placeholders: ["{text}"],
  },
];