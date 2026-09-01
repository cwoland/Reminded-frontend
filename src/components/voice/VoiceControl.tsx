"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useSpeechRecognition } from "@/lib/voice/useSpeechRecognition";
import { parseIntent } from "@/lib/voice/intents";
import type { CommandId, Intent } from "@/lib/voice/commands";
import { primeVoices, speak, stopSpeaking } from "@/lib/voice/speak";
import { cn } from "@/lib/cn";
import { defaultReplies, loadReplies, renderReply } from "@/lib/voice/replies";
import { VoiceCommandsModal } from "./VoiceCommandsModal";

const STORAGE_KEY = "reminded-voice-reply";

interface VoiceControlProps {
  onIntent: (intent: Intent) => Promise<{ command: CommandId; values: Record<string, string> }>;
}

export function VoiceControl({ onIntent }: VoiceControlProps) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  // Настройки читаем один раз при инициализации: компонент рендерится
  // только на клиенте, после того как AuthBootstrap подтвердил сессию.
  const [replyEnabled, setReplyEnabled] = useState(() => {
    if (typeof window === "undefined") return true;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === null ? true : stored === "true";
    } catch {
      return true;
    }
  });

  const [replies, setReplies] = useState(() =>
    typeof window === "undefined" ? { ...defaultReplies } : loadReplies()
  );

  useEffect(() => {
    primeVoices();
  }, []);

  function toggleReply() {
    setReplyEnabled((current) => {
      const next = !current;

      if (!next) stopSpeaking();

      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // не сохранилось — не страшно
      }

      return next;
    });
  }

  const handleResult = useCallback(
    async (variants: string[]) => {
      const intent = parseIntent(variants);

      if (!intent) {
        const message = renderReply(replies.unknown, { text: variants[0] ?? "" });
        setFeedback(message);
        if (replyEnabled) speak(message);
        setTimeout(() => setFeedback(null), 4000);
        return;
      }

      const outcome = await onIntent(intent);
      const message = renderReply(replies[outcome.command], outcome.values);

      setFeedback(message);
      if (replyEnabled) speak(message);
      setTimeout(() => setFeedback(null), 3500);
    },
    [onIntent, replyEnabled, replies]
  );

  const { state, interim, error, start, stop } = useSpeechRecognition({ onResult: handleResult });

  if (state === "unsupported") return null;

  const listening = state === "listening";

  function handleMicClick() {
    if (listening) {
      stop();
      return;
    }

    stopSpeaking();
    start();
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <button
          onClick={handleMicClick}
          aria-label={listening ? "Остановить запись" : "Голосовая команда"}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full border",
            "transition-[background-color,border-color,color,box-shadow,transform]",
            "duration-[var(--dur-press)] ease-[var(--ease-out-strong)] active:scale-[0.95]",
            listening
              ? "border-accent bg-accent/15 text-accent-strong"
              : "border-line text-faint hover:border-accent/60 hover:text-text"
          )}
          style={listening ? { boxShadow: "var(--glow)" } : undefined}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0" />
            <line x1="12" y1="18" x2="12" y2="22" />
          </svg>
        </button>

        <button
          onClick={toggleReply}
          aria-label={replyEnabled ? "Выключить голосовой ответ" : "Включить голосовой ответ"}
          title={replyEnabled ? "Ответы голосом включены" : "Ответы голосом выключены"}
          className={cn(
            "flex h-9 w-7 items-center justify-center rounded-full",
            "transition-colors duration-[var(--dur-hint)]",
            replyEnabled ? "text-accent" : "text-faint hover:text-muted"
          )}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 5 6 9H2v6h4l5 4z" />
            {replyEnabled ? (
              <>
                <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                <path d="M19 5a9 9 0 0 1 0 14" />
              </>
            ) : (
              <>
                <line x1="16" y1="9" x2="22" y2="15" />
                <line x1="22" y1="9" x2="16" y2="15" />
              </>
            )}
          </svg>
        </button>

        <button
          onClick={() => setHelpOpen(true)}
          aria-label="Список голосовых команд"
          className="flex h-9 w-7 items-center justify-center rounded-full text-faint transition-colors duration-[var(--dur-hint)] hover:text-text"
        >
          ?
        </button>
        <VoiceCommandsModal
        open={helpOpen}
        replies={replies}
        onChange={setReplies}
        onClose={() => setHelpOpen(false)}
      />
      </div>

      <AnimatePresence>
        {(listening || interim || feedback || error) && (
          <motion.div
            initial={{ opacity: 0, transform: "translateY(8px)" }}
            animate={{ opacity: 1, transform: "translateY(0px)" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="fixed bottom-6 left-1/2 z-[200] -translate-x-1/2 rounded-full border border-accent/30 bg-surface-1/90 px-5 py-2.5 backdrop-blur-xl"
            style={{ boxShadow: "var(--elev-2)" }}
          >
            <p className="flex items-center gap-2.5 text-sm text-text">
              {listening && (
                <span className="flex h-2 w-2 shrink-0 rounded-full bg-accent [animation:pulse_1.4s_ease-in-out_infinite]" />
              )}
              {error ?? feedback ?? interim ?? "Слушаю…"}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}