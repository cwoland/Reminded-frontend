const translitMap: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ж: "zh", з: "z", и: "i",
  й: "i", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s",
  т: "t", у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function translit(text: string): string {
  let result = "";

  for (const char of text) {
    result += translitMap[char] ?? char;
  }

  return result;
}

export function words(text: string): string[] {
  return normalize(text).split(" ").filter(Boolean);
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i++) {
    const current = [i];

    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + cost);
    }

    previous = current;
  }

  return previous[b.length];
}

function similar(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 3) return false;

  const distance = levenshtein(a, b);
  return distance / Math.max(a.length, b.length) <= 0.34;
}

export function score(query: string, title: string): number {
  const q = normalize(query);
  const t = normalize(title);

  if (!q || !t) return 0;
  if (q === t) return 1;

  const direct = scoreOne(q, t);
  const translited = scoreOne(translit(q), translit(t));

  return Math.max(direct, translited);
}

function scoreOne(q: string, t: string): number {
  if (q === t) return 1;
  if (t.includes(q) || q.includes(t)) return 0.92;

  const queryWords = q.split(" ").filter(Boolean);
  const titleWords = t.split(" ").filter(Boolean);

  if (queryWords.length === 0 || titleWords.length === 0) return 0;

  let matched = 0;
  for (const word of queryWords) {
    if (titleWords.some((candidate) => similar(word, candidate))) matched += 1;
  }

  const coverage = matched / queryWords.length;

  if (coverage === 1) return 0.88;
  if (coverage >= 0.5) return 0.6 + coverage * 0.2;

  const distance = levenshtein(q, t);
  const whole = 1 - distance / Math.max(q.length, t.length);

  return Math.max(coverage * 0.5, whole > 0.6 ? whole * 0.7 : 0);
}

export interface Candidate<T> {
  item: T;
  score: number;
}

export function bestMatch<T>(
  query: string,
  items: T[],
  titleOf: (item: T) => string,
  threshold = 0.62
): Candidate<T> | null {
  let best: Candidate<T> | null = null;

  for (const item of items) {
    const value = score(query, titleOf(item));

    if (value >= threshold && (!best || value > best.score)) {
      best = { item, score: value };
    }
  }

  return best;
}
