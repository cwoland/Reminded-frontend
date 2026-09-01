"use client";

import { HoloModal } from "@/components/ui/HoloModal";
import { Button } from "@/components/ui/Button";
import { commands, systemReplies, type CommandId } from "@/lib/voice/commands";
import { defaultReplies, resetReplies, saveReply } from "@/lib/voice/replies";

interface VoiceCommandsModalProps {
  open: boolean;
  replies: Record<CommandId, string>;
  onChange: (replies: Record<CommandId, string>) => void;
  onClose: () => void;
}

export function VoiceCommandsModal({ open, replies, onChange, onClose }: VoiceCommandsModalProps) {
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
    })),
    ...systemReplies.map((reply) => ({
      id: reply.id,
      title: reply.title,
      examples: [] as string[],
      placeholders: reply.placeholders,
    })),
  ];

  return (
    <HoloModal open={open} label="голосовые команды" width={600} onClose={onClose}>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
        <p className="text-xs text-faint">
          Слева — что можно сказать, справа — что ответит система. В ответах доступны подстановки
          в фигурных скобках.
        </p>

        <ul className="space-y-3">
          {rows.map((row) => (
            <li
              key={row.id}
              className="rounded-[var(--radius-md)] border border-line bg-surface-2/40 p-3"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-sm text-text">{row.title}</span>
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

      <footer className="flex shrink-0 items-center justify-between border-t border-accent/15 px-5 py-3">
        <span className="meta">настройки хранятся в браузере</span>
        <Button
          variant="ghost"
          onClick={() => {
            resetReplies();
            onChange({ ...defaultReplies });
          }}
        >
          Сбросить
        </Button>
      </footer>
    </HoloModal>
  );
}