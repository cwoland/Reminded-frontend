"use client";

import React, { useState } from "react";
import { useCreateTaskMutation, useGetProjectsQuery } from "@/lib/api/tasksApi";
import { Button } from "@/components/ui/Button";
import { fromDateInput } from "@/lib/deadline";

export function CreateTaskForm() {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [tagsInput, setTagsInput] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [projectId, setProjectId] = useState("");
    const [error, setError] = useState<string | null>(null);

    const [createTask, { isLoading }] = useCreateTaskMutation();
    const { data: projects } = useGetProjectsQuery();

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);

        const tags = tagsInput
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean);

        const due = fromDateInput(dueDate);

        try {
            await createTask({
                title: title.trim(),
                description: description.trim(),
                tags,
                ...(due ? { dueDate: due } : {}),
                ...(projectId ? { projectId } : {}),
            }).unwrap();

            setTitle("");
            setDescription("");
            setTagsInput("");
            setDueDate("");
        } catch (err) {
            setError((err as { message?: string }).message ?? "Не удалось создать задачу");
        }
    }

    const fieldClass =
        "w-full rounded-[var(--radius-md)] border border-line bg-surface-2 px-3 py-2 text-sm text-text outline-none transition-colors duration-[var(--dur-hint)] focus:border-accent";

    return (
        <form
            onSubmit={handleSubmit}
            className="rounded-[var(--radius-lg)] border border-line bg-surface-1/90 p-4 backdrop-blur-md"
        >
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Что нужно сделать?"
                required
                className={fieldClass}
            />

            <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Описание (необязательно)"
                rows={2}
                className={`${fieldClass} mt-2 resize-none`}
            />

            <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Теги через запятую"
                className={`${fieldClass} mt-2`}
            />

            <div className="mt-2 flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2">
                    <span className="meta">срок</span>
                    <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="rounded-[var(--radius-md)] border border-line bg-surface-2 px-3 py-1.5 text-xs text-text outline-none transition-colors duration-[var(--dur-hint)] focus:border-accent [color-scheme:dark]"
                    />
                </label>

                {projects && projects.length > 0 && (
                    <label className="flex items-center gap-2">
                        <span className="meta">проект</span>
                        <select
                            value={projectId}
                            onChange={(e) => setProjectId(e.target.value)}
                            className="rounded-[var(--radius-md)] border border-line bg-surface-2 px-3 py-1.5 text-xs text-text outline-none transition-colors duration-[var(--dur-hint)] focus:border-accent"
                        >
                            <option value="">без проекта</option>
                            {projects.map((project) => (
                                <option key={project.id} value={project.id}>
                                    {project.title}
                                </option>
                            ))}
                        </select>
                    </label>
                )}
            </div>

            {error && <p className="mt-2 text-sm text-cancelled">{error}</p>}

            <Button
                type="submit"
                variant="primary"
                disabled={isLoading || title.trim() === ""}
                className="mt-3"
            >
                {isLoading ? "Создаём…" : "Добавить задачу"}
            </Button>
        </form>
    );
}
