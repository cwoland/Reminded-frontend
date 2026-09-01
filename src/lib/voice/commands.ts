import type { TaskStatus } from "@/types/api";
import { parseDate, stripDate } from "./dates";

export type CommandId =
  | "show_projects"
  | "open_project"
  | "go_back"
  | "create_task"
  | "open_task"
  | "set_status"
  | "context_status"
  | "context_due"
  | "context_delete"
  | "add_comment"
  | "query_spent"
  | "query_overdue"
  | "query_in_progress"
  | "project_not_found"
  | "task_not_found"
  | "no_context"
  | "unknown";

export type Intent =
  | { kind: "show_projects" }
  | { kind: "open_project"; query: string }
  | { kind: "go_back" }
  | { kind: "create_task"; title: string; projectQuery?: string; dueDate?: string }
  | { kind: "open_task"; query: string }
  | { kind: "set_status"; query: string; status: TaskStatus }
  | { kind: "context_status"; status: TaskStatus }
  | { kind: "context_due"; dueDate: string }
  | { kind: "context_delete" }
  | { kind: "add_comment"; body: string }
  | { kind: "query_spent"; projectQuery?: string }
  | { kind: "query_overdue" }
  | { kind: "query_in_progress" };

export interface CommandSpec {
  id: CommandId;
  title: string;
  examples: string[];
  patterns: RegExp[];
  build: (match: RegExpMatchArray) => Intent | null;
  defaultReply: string;
  placeholders: string[];
  /** Команда работает только когда открыта карточка задачи */
  needsTask?: boolean;
}

const statusWords: { re: RegExp; status: TaskStatus }[] = [
  { re: /готов|заверш|сделан/i, status: "done" },
  { re: /в\s*работ|работаю|начал/i, status: "in_progress" },
  { re: /отмен|отклон/i, status: "cancelled" },
  { re: /заплан|отлож/i, status: "planned" },
];

function statusFrom(text: string): TaskStatus | null {
  return statusWords.find((entry) => entry.re.test(text))?.status ?? null;
}

/**
 * Порядок важен: контекстные и узкие правила идут раньше широких,
 * иначе «готово» съест «отметь отчёт готово».
 */
export const commands: CommandSpec[] = [
  // ——— контекст открытой задачи ———
  {
    id: "context_status",
    title: "Статус открытой задачи",
    examples: ["готово", "в работу", "отменить"],
    patterns: [/^(?:готов\w*|в\s*работ\w*|отмен\w*|заплан\w*)$/i],
    build: (m) => {
      const status = statusFrom(m[0]);
      return status ? { kind: "context_status", status } : null;
    },
    defaultReply: "{name} — {status}",
    placeholders: ["{name}", "{status}"],
    needsTask: true,
  },
  {
    id: "context_due",
    title: "Срок открытой задачи",
    examples: ["на завтра", "срок в пятницу", "через три дня"],
    patterns: [
      /^(?:срок\s+)?(?:на\s+|в\s+|во\s+)?(сегодня|завтра|послезавтра|через\s+.+|понедельник|вторник|сред[уы]|четверг|пятниц[уы]|суббот[уы]|воскресень[ея])$/i,
    ],
    build: (m) => {
      const dueDate = parseDate(m[1]);
      return dueDate ? { kind: "context_due", dueDate } : null;
    },
    defaultReply: "Срок: {due}",
    placeholders: ["{name}", "{due}"],
    needsTask: true,
  },
  {
    id: "context_delete",
    title: "Удалить открытую задачу",
    examples: ["удали", "удали задачу"],
    patterns: [/^удали(?:\s+(?:её|ее|эту)?\s*задачу)?$/i],
    build: () => ({ kind: "context_delete" }),
    defaultReply: "Удалил {name}",
    placeholders: ["{name}"],
    needsTask: true,
  },
  {
    id: "add_comment",
    title: "Комментарий к открытой задаче",
    examples: ["запиши созвонились, ждём макеты", "заметка нужен доступ"],
    patterns: [/^(?:запиши|заметка|комментарий|добавь\s+комментарий)\s*:?\s*(.+)$/i],
    build: (m) => ({ kind: "add_comment", body: m[1] }),
    defaultReply: "Записал",
    placeholders: ["{name}"],
    needsTask: true,
  },

  // ——— запросы ———
  {
    id: "query_overdue",
    title: "Что просрочено",
    examples: ["что просрочено", "просроченные"],
    patterns: [/^(?:что\s+)?просрочен\w*\??$/i],
    build: () => ({ kind: "query_overdue" }),
    defaultReply: "Просрочено: {count}. {list}",
    placeholders: ["{count}", "{list}"],
  },
  {
    id: "query_in_progress",
    title: "Что в работе",
    examples: ["что в работе", "чем я занят"],
    patterns: [/^(?:что\s+в\s+работе|чем\s+я\s+зан\w+)\??$/i],
    build: () => ({ kind: "query_in_progress" }),
    defaultReply: "В работе: {count}. {list}",
    placeholders: ["{count}", "{list}"],
  },
  {
    id: "query_spent",
    title: "Сколько времени потрачено",
    examples: ["сколько я потратил", "сколько времени на проект работа"],
    patterns: [
      /^сколько\s+(?:я\s+)?(?:потратил\w*|времени)(?:\s+на\s+проект\s+(.+))?\??$/i,
      /^сколько\s+времени\s+на\s+(.+)\??$/i,
    ],
    build: (m) => ({ kind: "query_spent", projectQuery: m[1] }),
    defaultReply: "Потрачено {time}{project}",
    placeholders: ["{time}", "{project}"],
  },

  // ——— общие команды ———
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
    examples: [
      "добавь задачу купить кофе",
      "создай задачу отчёт в проект работа",
      "добавь задачу созвон на завтра",
    ],
    patterns: [
      /^(?:добавь|создай|новая?)\s+(?:новую\s+)?задач[ауи]\s+(.+?)(?:\s+в\s+проект\s+(.+?))?$/i,
    ],
    build: (m) => {
      const rawTitle = m[1];
      const dueDate = parseDate(rawTitle);
      const title = dueDate ? stripDate(rawTitle) : rawTitle;

      if (!title) return null;

      return {
        kind: "create_task",
        title,
        projectQuery: m[2],
        ...(dueDate ? { dueDate } : {}),
      };
    },
    defaultReply: "Добавил: {name}",
    placeholders: ["{name}", "{project}", "{due}"],
  },
  {
    id: "set_status",
    title: "Сменить статус задачи",
    examples: ["отметь отчёт готово", "переведи созвон в работу"],
    patterns: [
      /^(?:отметь|поставь|переведи)\s+(?:задачу\s+)?(.+?)\s+(?:как\s+|в\s+)?(готов\w*|в\s*работ\w*|отмен\w*|заплан\w*)$/i,
    ],
    build: (m) => {
      const status = statusFrom(m[2]);
      return status ? { kind: "set_status", query: m[1], status } : null;
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
    id: "no_context",
    title: "Нет открытой задачи",
    defaultReply: "Сначала откройте задачу",
    placeholders: [],
  },
  {
    id: "unknown",
    title: "Команда не распознана",
    defaultReply: "Не понял команду",
    placeholders: ["{text}"],
  },
];
