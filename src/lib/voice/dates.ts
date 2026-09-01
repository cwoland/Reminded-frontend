/** Разбор относительных дат из речи: «завтра», «в понедельник», «через три дня» */

const weekdays: { re: RegExp; index: number }[] = [
  { re: /понедельник/i, index: 1 },
  { re: /вторник/i, index: 2 },
  { re: /сред[уы]/i, index: 3 },
  { re: /четверг/i, index: 4 },
  { re: /пятниц[уы]/i, index: 5 },
  { re: /суббот[уы]/i, index: 6 },
  { re: /воскресень[ея]/i, index: 0 },
];

const numberWords: Record<string, number> = {
  один: 1,
  одну: 1,
  два: 2,
  две: 2,
  три: 3,
  четыре: 4,
  пять: 5,
  шесть: 6,
  семь: 7,
  восемь: 8,
  девять: 9,
  десять: 10,
  неделю: 7,
  недели: 7,
};

function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 0, 0);
  return result;
}

function addDays(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return endOfDay(date);
}

/**
 * Возвращает ISO-строку срока или null, если в тексте нет даты.
 * Дата ставится на конец дня — «сделать до», а не «к началу».
 */
export function parseDate(text: string): string | null {
  const normalized = text.toLowerCase();

  if (/сегодня/.test(normalized)) return addDays(0).toISOString();
  if (/завтра/.test(normalized) && !/послезавтра/.test(normalized)) return addDays(1).toISOString();
  if (/послезавтра/.test(normalized)) return addDays(2).toISOString();

  const inDays = normalized.match(/через\s+(\d+|[а-яё]+)\s*(день|дня|дней|неделю|недели)?/i);
  if (inDays) {
    const raw = inDays[1];
    const amount = /^\d+$/.test(raw) ? Number(raw) : numberWords[raw];

    if (amount) {
      const multiplier = /недел/i.test(inDays[2] ?? "") ? 7 : 1;
      return addDays(amount * multiplier).toISOString();
    }
  }

  const weekday = weekdays.find((entry) => entry.re.test(normalized));
  if (weekday) {
    const today = new Date();
    let diff = (weekday.index - today.getDay() + 7) % 7;
    if (diff === 0) diff = 7; // «в понедельник», сказанное в понедельник, — это следующий

    return addDays(diff).toISOString();
  }

  return null;
}

/** Убирает из фразы хвост с датой, чтобы он не попал в название задачи */
export function stripDate(text: string): string {
  return text
    .replace(
      /\s+(?:на\s+)?(?:сегодня|завтра|послезавтра|в\s+понедельник|в\s+вторник|во\s+вторник|в\s+среду|в\s+четверг|в\s+пятницу|в\s+субботу|в\s+воскресенье|через\s+(?:\d+|[а-яё]+)\s*(?:день|дня|дней|неделю|недели)?)\s*$/i,
      ""
    )
    .trim();
}
