"use client";

import { useState } from "react";
import { useAddCommentMutation } from "@/lib/api/tasksApi";
import { Button } from "@/components/ui/Button";

export function CommentForm({ taskId }: { taskId: string }) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [addComment, { isLoading }] = useAddCommentMutation();

  async function submit() {
    const trimmed = body.trim();
    if (trimmed === "") return;

    setError(null);

    try {
      await addComment({ taskId, body: trimmed }).unwrap();
      setBody("");
    } catch (err) {
      setError((err as { message?: string }).message ?? "Не удалось добавить");
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="space-y-2"
    >
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="Что нового по задаче?"
        rows={2}
        className="w-full resize-none rounded-[var(--radius-md)] border border-line bg-surface-2 px-3 py-2 text-sm text-text outline-none transition-colors duration-[var(--dur-hint)] focus:border-accent"
      />

      {error && <p className="text-xs text-cancelled">{error}</p>}

      <div className="flex items-center justify-between">
        <span className="meta">⌘ + enter</span>
        <Button variant="primary" type="submit" disabled={isLoading || body.trim() === ""}>
          {isLoading ? "…" : "Добавить"}
        </Button>
      </div>
    </form>
  );
}