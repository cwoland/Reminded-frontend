"use client";

import { useState, useSyncExternalStore } from "react";
import { HoloModal } from "@/components/ui/HoloModal";
import { Button } from "@/components/ui/Button";
import { commands, systemReplies, type CommandId } from "@/lib/voice/commands";
import { defaultReplies, resetReplies, saveReply } from "@/lib/voice/replies";
import {
  clearVoiceLog,
  getEmptyVoiceLog,
  getVoiceLog,
  subscribeToVoiceLog,
} from "@/lib/voice/log";
import { WAKE_WORDS } from "./VoiceControl";
import { cn } from "@/lib/cn";

type Tab = "commands" | "log";

interface VoiceCommandsModalProps {
  open: boolean;
  replies: Record<CommandId, string>;
  onChange: (replies: Record<CommandId, string>) => void;
  onClose: () => void;
}

export function VoiceCommandsModal({ open, replies, onChange, onClose }: VoiceCommandsModalProps) {
  const [tab, setTab] = useState<Tab>("commands");

  const log = useSyncExternalStore(subscribeToVoiceLog, getVoiceLog, getEmptyVoiceLog);

  function update(id: CommandId, template: string) {
    onChange({ ...replies, [id]: template });
    saveReply(id, template);
  }

  const rows = [
    ...commands.map((command) => ({
      id: command.id,
      title: command.title,
      examples: command.examples,
      placeholders: command.placeholders,
      needsTask: command.needsTask ?? false,
    })),
    ...systemReplies.map((reply) => ({
      id: reply.id,
      title: reply.title,
      examples: [] as string[],
      placeholders: reply.placeholders,
      needsTask: false,
    })),
  ];

  const tabClass = (active: boolean) =>
    cn(
      "rounded-full px-3 py-1 text-xs transition-colors duration-[var(--dur-hint)]",
      active ? "bg-surface-3 text-text" : "text-faint hover:text-muted"
    );

  return (
    <HoloModal open={open} label="голос" width={620} onClose={onClose}>
      <div className="flex shrink-0 items-center gap-1 border-b border-accent/10 px-5 py-2">
        <button onClick={() => setTab("commands")} className={tabClass(tab === "commands")}>
          Команды
        </button>
        <button onClick={() => setTab("log")} className={tabClass(tab === "log")}>
          Журнал {log.length > 0 && <span className="tabular-nums">· {log.length}</span>}
        </button>
      </div>

      {tab === "commands" ? (
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <p className="text-xs text-faint">
            Слева — что можно сказать, справа — что ответит система. В ответах доступны подстановки
            в фигурных скобках. Команды с пометкой «контекст» работают, когда открыта карточка
            задачи. Ключевые слова для фонового режима: {WAKE_WORDS.join(", ")}.
          </p>

          <ul className="space-y-3">
            {rows.map((row) => (
              <li
                key={row.id}
                className="rounded-[var(--radius-md)] border border-line bg-surface-2/40 p-3"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm text-text">
                    {row.title}
                    {row.needsTask && (
                      <span className="rounded-full border border-accent/40 px-1.5 py-0.5 text-[10px] text-accent">
                        контекст
                      </span>
                    )}
                  </span>
                  {row.placeholders.length > 0 && (
                    <span className="meta">{row.placeholders.join(" · ")}</span>
                  )}
                </div>

                {row.examples.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {row.examples.map((example) => (
                      <li
                        key={example}
                        className="rounded-full bg-surface-3 px-2.5 py-0.5 text-[11px] text-muted"
                      >
                        «{example}»
                      </li>
                    ))}
                  </ul>
                )}

                <input
                  value={replies[row.id]}
                  onChange={(event) => update(row.id, event.target.value)}
                  placeholder={defaultReplies[row.id]}
                  className="mt-2 w-full rounded-[var(--radius-sm)] border border-line bg-surface-2 px-3 py-1.5 text-xs text-text outline-none transition-colors duration-[var(--dur-hint)] focus:border-accent"
                />
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-5 py-4">
          {log.length === 0 ? (
            <p className="text-xs text-faint">
              Пока пусто. Здесь появятся последние фразы: что услышала система и как поняла.
            </p>
          ) : (
            <ul className="space-y-2">
              {log.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-[var(--radius-md)] border border-line bg-surface-2/40 px-3 py-2"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm text-text">«{entry.heard}»</span>
                    <span className="meta shrink-0">
                      {new Date(entry.at).toLocaleTimeString("ru-RU", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                    <span
                      className="rounded-full px-2 py-0.5"
                      style={{
                        color: entry.command ? "var(--status-done)" : "var(--status-cancelled)",
                        background: entry.command
                          ? "color-mix(in oklab, var(--status-done) 12%, transparent)"
                          : "color-mix(in oklab, var(--status-cancelled) 12%, transparent)",
                      }}
                    >
                      {entry.command ?? "не понял"}
                    </span>
                    <span className="text-muted">{entry.reply}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <footer className="flex shrink-0 items-center justify-between border-t border-accent/15 px-5 py-3">
        <span className="meta">
          {tab === "commands" ? "настройки хранятся в браузере" : "последние 30 фраз"}
        </span>

        {tab === "commands" ? (
          <Button
            variant="ghost"
            onClick={() => {
              resetReplies();
              onChange({ ...defaultReplies });
            }}
          >
            Сбросить
          </Button>
        ) : (
          <Button variant="ghost" onClick={clearVoiceLog} disabled={log.length === 0}>
            Очистить
          </Button>
        )}
      </footer>
    </HoloModal>
  );
}
