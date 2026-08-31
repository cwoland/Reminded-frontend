"use client";

import { useState } from "react";
import { useCreateProjectMutation } from "@/lib/api/tasksApi";
import { Button } from "@/components/ui/Button";

const palette = ["#4db8ff", "#3fbf8f", "#e0736f", "#c58af9", "#f0b429", "#8b9bad"];

export function CreateProjectForm() {
  const [title, setTitle] = useState("");
  const [color, setColor] = useState(palette[0]);
  const [error, setError] = useState<string | null>(null);
  const [tasksInput, setTasksInput] = useState("");

  const [createProject, { isLoading }] = useCreateProjectMutation();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      const tasks = tasksInput
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      
      await createProject({ title: title.trim(), color, tasks }).unwrap();
      setTitle("");
      setTasksInput("");
    } catch (err) {
      setError((err as { message?: string }).message ?? "Не удалось создать проект");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-center gap-2 rounded-[var(--radius-lg)] border border-line bg-surface-1 p-3"
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Новый проект"
        required
        className="min-w-0 flex-1 rounded-[var(--radius-md)] border border-line bg-surface-2 px-3 py-2 text-sm text-text outline-none focus:border-accent"
      />

      <textarea
        value={tasksInput}
        onChange={(e) => setTasksInput(e.target.value)}
        placeholder={"Задачи — по одной на строку\nНапример:\nСобрать требования\nНарисовать схему"}
        rows={3}
        className="mt-2 w-full resize-none rounded-[var(--radius-md)] border border-line bg-surface-2 px-3 py-2 text-sm text-text outline-none transition-colors duration-[var(--dur-hint)] focus:border-accent"
      />

      <div className="flex gap-1.5">
        {palette.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setColor(value)}
            aria-label={`Цвет ${value}`}
            className="h-6 w-6 rounded-full border-2 transition-transform duration-[var(--dur-press)] ease-[var(--ease-out-strong)] active:scale-[0.9]"
            style={{
              background: value,
              borderColor: color === value ? "var(--text)" : "transparent",
            }}
          />
        ))}
      </div>

      <Button variant="primary" type="submit" disabled={isLoading || title.trim() === ""}>
        {isLoading ? "…" : "Создать"}
      </Button>

      {error && <p className="w-full text-xs text-cancelled">{error}</p>}
    </form>
  );
}