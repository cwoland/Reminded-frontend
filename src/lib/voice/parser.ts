import type { Project, Task, TaskStatus } from "@/types/api";
import { parseDate, stripDate } from "./dates";
import { bestMatch, normalize, score } from "./match";

export type Intent =
  | { kind: "show_projects" }
  | { kind: "go_back" }
  | { kind: "open_project"; projectId: string; title: string }
  | { kind: "open_task"; taskId: string; title: string }
  | { kind: "create_task"; title: string; projectId?: string; projectTitle?: string; dueDate?: string }
  | { kind: "set_status"; taskId: string; title: string; status: TaskStatus }
  | { kind: "context_status"; status: TaskStatus }
  | { kind: "context_due"; dueDate: string }
  | { kind: "context_delete" }
  | { kind: "add_comment"; body: string }
  | { kind: "query_spent"; projectId?: string; projectTitle?: string }
  | { kind: "query_overdue" }
  | { kind: "query_in_progress" };

export type ParseResult =
  | { status: "ok"; intent: Intent }
  | { status: "needs_task" }
  | { status: "not_found"; what: "project" | "task"; query: string }
  | { status: "unknown" };

export interface ParseContext {
  hasTask: boolean;
  projects: Project[];
  tasks: Task[];
}

const verbs = {
  open: /^(?:открой|открыть|откр[оы][а-я]*|покажи|показать|перейди|перейти|переключись|переключи|найди|найти|запусти|загрузи)$/,
  create: /^(?:добавь|добавить|создай|создать|заведи|завести|новая|новую|новый)$/,
  status: /^(?:отметь|отметить|переведи|перевести|перенеси|перенести|перемести|переместить|помести|поместить|поставь|поставить|сделай|сделать|закрой|закрыть|заверши|завершить|начни|начать|верни|вернуть|смени|сменить|измени|изменить|кинь|закинь|отправь)$/,
  remove: /^(?:удали|удалить|убери|убрать|снеси|снести)$/,
  comment: /^(?:запиши|записать|заметка|заметку|комментарий|комментарии|коммент|прокомментируй)$/,
};

const statusWords: { re: RegExp; status: TaskStatus }[] = [
  { re: /^готов[а-я]*$/, status: "done" },
  { re: /^(?:заверш[а-я]*|сделан[а-я]*|выполнен[а-я]*|закрыт[а-я]*)$/, status: "done" },
  { re: /^работ[а-я]*$/, status: "in_progress" },
  { re: /^(?:начат[а-я]*|начал[а-я]*|процесс[а-я]*|активн[а-я]*)$/, status: "in_progress" },
  { re: /^отмен[а-я]*$/, status: "cancelled" },
  { re: /^(?:отклон[а-я]*|отказ[а-я]*)$/, status: "cancelled" },
  { re: /^заплан[а-я]*$/, status: "planned" },
  { re: /^(?:отлож[а-я]*|бэклог|бек лог)$/, status: "planned" },
];

const fillers = new Set([
  "задачу", "задача", "задачи", "задаче", "задачей",
  "проект", "проекта", "проекте", "проекту", "проектом",
  "в", "во", "на", "к", "как", "из", "у", "по", "для", "это", "эту", "этот", "её", "ее", "их",
  "пожалуйста", "мне", "мою", "мой", "моё", "мое",
]);

function findStatus(word: string): TaskStatus | null {
  return statusWords.find((entry) => entry.re.test(word))?.status ?? null;
}

function stripFillers(tokens: string[]): string {
  return tokens.filter((token) => !fillers.has(token)).join(" ").trim();
}

function mentionsProject(tokens: string[]): boolean {
  return tokens.some((token) => token.startsWith("проект"));
}

function mentionsTask(tokens: string[]): boolean {
  return tokens.some((token) => token.startsWith("задач"));
}

function parseOne(text: string, context: ParseContext): ParseResult | null {
  const normalized = normalize(text);
  if (!normalized) return null;

  const tokens = normalized.split(" ");
  const [first, ...rest] = tokens;

  const soft = text
    .trim()
    .replace(/[.,!?;:]+$/g, "")
    .replace(/\s+/g, " ");
  const softTail = soft.split(" ").slice(1).join(" ").trim();

  if (/^(?:все )?проект(?:ы|ов)$/.test(normalized)) {
    return { status: "ok", intent: { kind: "show_projects" } };
  }

  if (/^(?:назад|наверх|выйди|выход|система|вернись|обзор)$/.test(normalized)) {
    return { status: "ok", intent: { kind: "go_back" } };
  }

  if (/просрочен/.test(normalized)) {
    return { status: "ok", intent: { kind: "query_overdue" } };
  }

  if (/^(?:что в работе|чем я зан[а-я]+|что делаю|текущие)$/.test(normalized)) {
    return { status: "ok", intent: { kind: "query_in_progress" } };
  }

  if (/^сколько/.test(normalized)) {
    const tail = normalized.replace(/^сколько\s+(?:я\s+)?(?:потратил[а-я]*|времени|часов)?\s*/, "");
    const query = stripFillers(tail.split(" ").filter(Boolean));

    if (!query) return { status: "ok", intent: { kind: "query_spent" } };

    const project = bestMatch(query, context.projects, (item) => item.title);

    return project
      ? {
          status: "ok",
          intent: {
            kind: "query_spent",
            projectId: project.item.id,
            projectTitle: project.item.title,
          },
        }
      : { status: "not_found", what: "project", query };
  }

  const contextStatus = tokens.length <= 3 ? tokens.map(findStatus).find(Boolean) : null;

  if (contextStatus && !verbs.status.test(first)) {
    if (!context.hasTask) return { status: "needs_task" };
    return { status: "ok", intent: { kind: "context_status", status: contextStatus } };
  }

  if (verbs.comment.test(first)) {
    const body = softTail.replace(/^:\s*/, "").trim();

    if (body) {
      if (!context.hasTask) return { status: "needs_task" };
      return { status: "ok", intent: { kind: "add_comment", body } };
    }
  }

  if (verbs.remove.test(first) && stripFillers(rest) === "") {
    if (!context.hasTask) return { status: "needs_task" };
    return { status: "ok", intent: { kind: "context_delete" } };
  }

  if (tokens.length <= 4 && !verbs.create.test(first) && !verbs.open.test(first)) {
    const dueOnly = parseDate(normalized);

    if (dueOnly && stripDate(normalized).replace(/^срок\s*/, "").trim() === "") {
      if (!context.hasTask) return { status: "needs_task" };
      return { status: "ok", intent: { kind: "context_due", dueDate: dueOnly } };
    }
  }

  if (verbs.create.test(first)) {
    let tail = softTail;

    let projectQuery: string | null = null;
    const inProject = tail.match(/\s+(?:в|во|для)\s+проект[а-я]*\s+(.+)$/i);

    if (inProject) {
      projectQuery = inProject[1].trim();
      tail = tail.slice(0, inProject.index).trim();
    }

    const dueDate = parseDate(tail);
    if (dueDate) tail = stripDate(tail);

    const title = tail
      .replace(/^(?:новую |новый |новая )?задач[а-я]*\s*/i, "")
      .replace(/^:\s*/, "")
      .trim();

    if (!title) return null;

    if (projectQuery) {
      const project = bestMatch(projectQuery, context.projects, (item) => item.title);
      if (!project) return { status: "not_found", what: "project", query: projectQuery };

      return {
        status: "ok",
        intent: {
          kind: "create_task",
          title,
          projectId: project.item.id,
          projectTitle: project.item.title,
          ...(dueDate ? { dueDate } : {}),
        },
      };
    }

    return {
      status: "ok",
      intent: { kind: "create_task", title, ...(dueDate ? { dueDate } : {}) },
    };
  }

  const statusIndex = tokens.findIndex((token, index) => index > 0 && findStatus(token) !== null);

  if (statusIndex > 0 && (verbs.status.test(first) || mentionsTask(tokens))) {
    const status = findStatus(tokens[statusIndex])!;
    const nameTokens = tokens.slice(1, statusIndex);
    const query = stripFillers(nameTokens);

    if (query) {
      const task = bestMatch(query, context.tasks, (item) => item.title);

      if (task) {
        return {
          status: "ok",
          intent: {
            kind: "set_status",
            taskId: task.item.id,
            title: task.item.title,
            status,
          },
        };
      }

      return { status: "not_found", what: "task", query };
    }

    if (context.hasTask) {
      return { status: "ok", intent: { kind: "context_status", status } };
    }

    return { status: "needs_task" };
  }

  const isOpen = verbs.open.test(first);
  const query = stripFillers(isOpen ? rest : tokens);

  if (!query) return null;

  const wantsProject = mentionsProject(tokens);
  const wantsTask = mentionsTask(tokens);

  const project = wantsTask ? null : bestMatch(query, context.projects, (item) => item.title);
  const task = wantsProject ? null : bestMatch(query, context.tasks, (item) => item.title);

  const threshold = isOpen ? 0.62 : 0.8;

  const projectScore = project && project.score >= threshold ? project.score : 0;
  const taskScore = task && task.score >= threshold ? task.score : 0;

  if (projectScore === 0 && taskScore === 0) {
    if (isOpen && wantsProject) return { status: "not_found", what: "project", query };
    if (isOpen && wantsTask) return { status: "not_found", what: "task", query };
    if (isOpen) return { status: "not_found", what: "project", query };

    return null;
  }

  if (projectScore >= taskScore) {
    return {
      status: "ok",
      intent: { kind: "open_project", projectId: project!.item.id, title: project!.item.title },
    };
  }

  return {
    status: "ok",
    intent: { kind: "open_task", taskId: task!.item.id, title: task!.item.title },
  };
}

export function parseIntent(variants: string[], context: ParseContext): ParseResult {
  let fallback: ParseResult | null = null;

  for (const variant of variants) {
    const result = parseOne(variant, context);
    if (!result) continue;

    if (result.status === "ok") return result;
    if (!fallback) fallback = result;
  }

  return fallback ?? { status: "unknown" };
}

export { score };
