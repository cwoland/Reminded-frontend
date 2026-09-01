let cachedVoice: SpeechSynthesisVoice | null = null;

function supported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function pickVoice(): SpeechSynthesisVoice | null {
  if (!supported()) return null;
  if (cachedVoice) return cachedVoice;

  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  const russian = voices.filter((voice) => voice.lang.toLowerCase().startsWith("ru"));

  cachedVoice = russian.find((voice) => voice.localService) ?? russian[0] ?? null;
  return cachedVoice;
}

/** Прогреть список голосов — он заполняется асинхронно */
export function primeVoices(): void {
  if (!supported()) return;

  pickVoice();

  window.speechSynthesis.addEventListener(
    "voiceschanged",
    () => {
      cachedVoice = null;
      pickVoice();
    },
    { once: true }
  );
}

export function speak(text: string): void {
  if (!supported()) return;

  const trimmed = text.trim();
  if (!trimmed) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(trimmed);
  utterance.lang = "ru-RU";
  utterance.rate = 1.08;
  utterance.pitch = 0.95;
  utterance.volume = 0.85;

  const voice = pickVoice();
  if (voice) utterance.voice = voice;

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (!supported()) return;
  window.speechSynthesis.cancel();
}