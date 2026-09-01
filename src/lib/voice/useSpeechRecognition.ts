"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

interface Options {
  onResult: (variants: string[]) => void;
}

export type VoiceState = "idle" | "listening" | "unsupported";

/** Поддержка распознавания — внешнее (браузерное) состояние, читаем без setState */
function subscribeToNothing(): () => void {
  return () => {};
}

function isSupportedOnClient(): boolean {
  return Boolean(window.SpeechRecognition ?? window.webkitSpeechRecognition);
}

export function useSpeechRecognition({ onResult }: Options) {
  const supported = useSyncExternalStore(subscribeToNothing, isSupportedOnClient, () => false);

  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const onResultRef = useRef(onResult);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    if (!supported) return;

    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.lang = "ru-RU";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 5;

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
      if (event.error === "no-speech") {
        setError("Не расслышал");
      } else if (event.error === "not-allowed") {
        setError("Нет доступа к микрофону");
      } else if (event.error !== "aborted") {
        setError("Ошибка распознавания");
      }
    };

    recognition.onend = () => {
      setListening(false);
      setInterim("");
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

  const state: VoiceState = !supported ? "unsupported" : listening ? "listening" : "idle";

  return { state, interim, error, start, stop };
}