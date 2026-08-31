"use client";

import React, { useState } from "react";
import { useCreateTaskMutation } from "@/lib/api/tasksApi";

export function CreateTaskForm() {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [tagsInput, setTagsInput] = useState("");
    const [error, setError] = useState<string | null>(null);

    const [createTask, { isLoading }] = useCreateTaskMutation();

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);

        const tags = tagsInput
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean);

        try {
            await createTask({
                title: title.trim(),
                description: description.trim(),
                tags,
            }).unwrap();

            setTitle("");
            setDescription("");
            setTagsInput("");
        } catch (err) {
            setError((err as { message?: string }).message ?? "Не удалось создать задачу");
        }
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-line bg-surface-1 p-4 shadow-sm"
        >
            <input 
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Что нужно сделать?"
                required
                className="w-full rounded-lg border border-line px-3 py-2 text-text outline-none focus:border-accent"
            />

            <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Описание (необязательно)"
                rows={2}
                className="mt-2 w-full resize-none rounded-lg border border-line px-3 py-2 text-sm text-text outline-none focus:border-accent"
            />

            <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Теги через запятую"
                className="mt-2 w-full rounded-lg border border-line px-3 py-2 text-sm text-text outline-none focus:border-accent"
            />

            {error && <p className="mt-2 text-sm text-red-700">{error}</p>}

            <button
                type="submit"
                disabled={isLoading || title.trim() === ""}
                className="mt-3 rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
            >
                {isLoading ? "Создаем..." : "Добавить задачу"}
            </button>
        </form>
    );
}