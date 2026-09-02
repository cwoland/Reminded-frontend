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
  | "create_project"
  | "rename_task"
  | "context_project"
  | "context_clear_due"
  | "switch_view"
  | "query_today"
  | "query_week"
  | "query_stats"
  | "repeat"
  | "project_not_found"
  | "task_not_found"
  | "no_context"
  | "unknown";

export interface CommandSpec {
  id: CommandId;
  title: string;
  examples: string[];
  defaultReply: string;
  placeholders: string[];
  needsTask?: boolean;
}

export const commands: CommandSpec[] = [
  {
    id: "context_status",
    title: "Статус открытой задачи",
    examples: ["готово", "в работу", "отменить"],
    defaultReply: "{name} — {status}",
    placeholders: ["{name}", "{status}"],
    needsTask: true,
  },
  {
    id: "context_due",
    title: "Срок открытой задачи",
    examples: ["на завтра", "в пятницу", "через три дня"],
    defaultReply: "Срок: {due}",
    placeholders: ["{name}", "{due}"],
    needsTask: true,
  },
  {
    id: "context_delete",
    title: "Удалить открытую задачу",
    examples: ["удали", "убери"],
    defaultReply: "Удалил {name}",
    placeholders: ["{name}"],
    needsTask: true,
  },
  {
    id: "add_comment",
    title: "Комментарий к открытой задаче",
    examples: ["запиши созвонились, ждём макеты", "заметка нужен доступ"],
    defaultReply: "Записал",
    placeholders: ["{name}"],
    needsTask: true,
  },
  {
    id: "rename_task",
    title: "Переименовать открытую задачу",
    examples: ["переименуй в купить кофе", "назови созвон с Петровым"],
    defaultReply: "Теперь {name}",
    placeholders: ["{name}"],
    needsTask: true,
  },
  {
    id: "context_project",
    title: "Перенести открытую задачу в проект",
    examples: ["в проект дом", "в проект работа"],
    defaultReply: "{name} → {project}",
    placeholders: ["{name}", "{project}"],
    needsTask: true,
  },
  {
    id: "context_clear_due",
    title: "Убрать срок у открытой задачи",
    examples: ["убери срок", "без срока"],
    defaultReply: "Срок снят",
    placeholders: ["{name}"],
    needsTask: true,
  },
  {
    id: "switch_view",
    title: "Переключить вид",
    examples: ["список", "орбита", "сцена"],
    defaultReply: "{view}",
    placeholders: ["{view}"],
  },
  {
    id: "repeat",
    title: "Повторить ответ",
    examples: ["повтори", "что ты сказал"],
    defaultReply: "{text}",
    placeholders: ["{text}"],
  },
  {
    id: "query_today",
    title: "Что сегодня",
    examples: ["что сегодня", "планы на сегодня"],
    defaultReply: "На сегодня: {count}. {list}",
    placeholders: ["{count}", "{list}"],
  },
  {
    id: "query_week",
    title: "Что на неделе",
    examples: ["что на этой неделе", "планы на неделю"],
    defaultReply: "На неделю: {count}. {list}",
    placeholders: ["{count}", "{list}"],
  },
  {
    id: "query_stats",
    title: "Общая сводка",
    examples: ["статистика", "сколько задач", "как дела"],
    defaultReply: "Всего {total}, в работе {active}, просрочено {overdue}, готово {done}",
    placeholders: ["{total}", "{active}", "{overdue}", "{done}"],
  },
  {
    id: "create_project",
    title: "Создать проект",
    examples: ["создай проект ремонт", "новый проект учёба"],
    defaultReply: "Проект {name} создан",
    placeholders: ["{name}"],
  },
  {
    id: "query_overdue",
    title: "Что просрочено",
    examples: ["что просрочено", "просроченные"],
    defaultReply: "Просрочено: {count}. {list}",
    placeholders: ["{count}", "{list}"],
  },
  {
    id: "query_in_progress",
    title: "Что в работе",
    examples: ["что в работе", "чем я занят"],
    defaultReply: "В работе: {count}. {list}",
    placeholders: ["{count}", "{list}"],
  },
  {
    id: "query_spent",
    title: "Сколько времени потрачено",
    examples: ["сколько я потратил", "сколько времени на проект работа"],
    defaultReply: "Потрачено {time}{project}",
    placeholders: ["{time}", "{project}"],
  },
  {
    id: "show_projects",
    title: "Список проектов",
    examples: ["проекты", "все проекты"],
    defaultReply: "Проекты",
    placeholders: [],
  },
  {
    id: "go_back",
    title: "Вернуться в систему",
    examples: ["назад", "вернись", "обзор"],
    defaultReply: "Возвращаюсь",
    placeholders: [],
  },
  {
    id: "open_project",
    title: "Открыть проект",
    examples: ["открой проект калькулятор", "покажи проект дом", "калькулятор вик"],
    defaultReply: "Проект {name}",
    placeholders: ["{name}"],
  },
  {
    id: "open_task",
    title: "Открыть задачу",
    examples: ["открой задачу отчёт", "найди задачу созвон"],
    defaultReply: "Задача {name}",
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
    defaultReply: "Добавил: {name}",
    placeholders: ["{name}", "{project}", "{due}"],
  },
  {
    id: "set_status",
    title: "Сменить статус задачи",
    examples: [
      "отметь отчёт готово",
      "перенеси задачу побриться в готово",
      "переведи созвон в работу",
    ],
    defaultReply: "{name} — {status}",
    placeholders: ["{name}", "{status}"],
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
    defaultReply: "Не понял: {text}",
    placeholders: ["{text}"],
  },
];
