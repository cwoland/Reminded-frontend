"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

interface Options {
  onResult: (variants: string[]) => void;
  /** Фоновое ожидание ключевого слова */
  wake?: {
    enabled: boolean;
    words: string[];
  };
}

export type VoiceState = "idle" | "listening" | "unsupported";

function subscribeToNothing(): () => void {
  return () => {};
}

function isSupportedOnClient(): boolean {
  return Boolean(window.SpeechRecognition ?? window.webkitSpeechRecognition);
}

function createRecognition(continuous: boolean): SpeechRecognition | null {
  const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
  if (!Ctor) return null;

  const recognition = new Ctor();
  recognition.lang = "ru-RU";
  recognition.continuous = continuous;
  recognition.interimResults = !continuous;
  recognition.maxAlternatives = continuous ? 1 : 5;

  return recognition;
}

/** Ищет ключевое слово и возвращает то, что сказано после него */
function afterWakeWord(text: string, words: string[]): string | null {
  const lower = text.toLowerCase();

  for (const word of words) {
    const index = lower.indexOf(word.toLowerCase());
    if (index === -1) continue;

    return text.slice(index + word.length).replace(/^[\s,.:!?]+/, "").trim();
  }

  return null;
}

export function useSpeechRecognition({ onResult, wake }: Options) {
  const supported = useSyncExternalStore(subscribeToNothing, isSupportedOnClient, () => false);

  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const wakeRecognitionRef = useRef<SpeechRecognition | null>(null);
  const wakeRestartRef = useRef<number | null>(null);

  const onResultRef = useRef(onResult);
  const listeningRef = useRef(false);
  const wakeEnabledRef = useRef(false);
  const wakeWordsRef = useRef<string[]>([]);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    listeningRef.current = listening;
  }, [listening]);

  useEffect(() => {
    wakeEnabledRef.current = wake?.enabled ?? false;
    wakeWordsRef.current = wake?.words ?? [];
  }, [wake?.enabled, wake?.words]);

  // ——— распознавание по кнопке ———
  useEffect(() => {
    if (!supported) return;

    const recognition = createRecognition(false);
    if (!recognition) return;

    recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];

      if (!result.isFinal) {
        setInterim(result[0]?.transcript ?? "");
        return;
      }

      const variants: string[] = [];
      for (let i = 0; i < result.length; i++) {
        const transcript = result[i]?.transcript?.trim();
        if (transcript) variants.push(transcript);
      }

      setInterim("");
      onResultRef.current(variants);
    };

    recognition.onerror = (event) => {
      if (event.error === "no-speech") setError("Не расслышал");
      else if (event.error === "not-allowed") setError("Нет доступа к микрофону");
      else if (event.error !== "aborted") setError("Ошибка распознавания");
    };

    recognition.onend = () => {
      setListening(false);
      setInterim("");

      // вернуть фоновое ожидание, если оно включено
      if (wakeEnabledRef.current) {
        wakeRestartRef.current = window.setTimeout(() => {
          try {
            wakeRecognitionRef.current?.start();
          } catch {
            // уже запущено
          }
        }, 400);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.abort();
      recognitionRef.current = null;
    };
  }, [supported]);

  const start = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    // один микрофон — фоновое ожидание уступает место команде
    wakeRecognitionRef.current?.abort();

    setError(null);

    try {
      recognition.start();
      setListening(true);
    } catch {
      // start() при уже запущенном распознавании бросает InvalidStateError
    }
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  // ——— фоновое ожидание ключевого слова ———
  useEffect(() => {
    if (!supported || !wake?.enabled) return;

    const recognition = createRecognition(true);
    if (!recognition) return;

    let stopped = false;

    function restart(delay: number) {
      if (stopped || listeningRef.current) return;

      wakeRestartRef.current = window.setTimeout(() => {
        try {
          recognition!.start();
        } catch {
          // уже запущено
        }
      }, delay);
    }

    recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      if (!result.isFinal) return;

      const heard = result[0]?.transcript ?? "";
      const rest = afterWakeWord(heard, wakeWordsRef.current);

      if (rest === null) return;

      if (rest.length > 0) {
        onResultRef.current([rest]);
        return;
      }

      // сказали только имя — переходим в активное слушание
      recognition.abort();
      const command = recognitionRef.current;

      if (command) {
        try {
          command.start();
          setListening(true);
        } catch {
          // уже слушаем
        }
      }
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed") {
        stopped = true;
        setError("Нет доступа к микрофону");
      }
    };

    recognition.onend = () => {
      // браузер сам обрывает длинные сессии — поднимаем заново
      restart(600);
    };

    wakeRecognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      // уже запущено
    }

    return () => {
      stopped = true;

      if (wakeRestartRef.current !== null) {
        clearTimeout(wakeRestartRef.current);
        wakeRestartRef.current = null;
      }

      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.abort();

      wakeRecognitionRef.current = null;
    };
  }, [supported, wake?.enabled]);

  const state: VoiceState = !supported ? "unsupported" : listening ? "listening" : "idle";

  const wakeActive = Boolean(supported && wake?.enabled && !listening);

  return { state, interim, error, wakeActive, start, stop };
}
