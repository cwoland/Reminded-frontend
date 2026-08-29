"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { useGetTaskQuery, useGetTasksQuery } from "@/lib/api/tasksApi";
import { useAuthStore } from "@/store/auth";
import type { TaskStatus } from "@/types/api";

const statusLabels: Record<TaskStatus, string> = {
    planned: "Запланировано",
    in_progress: "В работе",
    done: "Готово",
    cancelled: "Отменено",
};

const statusStyles: Record<TaskStatus, string> = {
    planned: "bg-slate-100 text-slate-700",
    in_progress: "bg-blue-100 text-blue-700",
    done: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
};

export default function TasksPage() {
    return (
        <AuthGuard>
            <TasksScreen />
        </AuthGuard>
    );
}

function TasksScreen() {
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);

    const { data: tasks, isLoading, error } = useGetTasksQuery();

    return (
        <main className="mx-auto max-w-3xl p-6">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">Задачи</h1>
                    <p className="text-sm text-slate-500">{user?.username}</p>
                </div>
                <button
                    onClick={logout}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                Выйти
                </button>
            </header>

            <section className="mt-6">
                {isLoading && <p className="text-slate-500">Загрузка...</p>}
                {error && (
                    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                        Не удалось загрузить задачи
                    </p>
                )}

                {tasks && tasks.length === 0 && (
                    <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
                        Задач пока нет
                    </p>
                )}

                <ul className="space-y-3">
                    {tasks?.map((task) => (
                        <li 
                            key={task.id}
                            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="flex items-start justify-between gap-4">
                                    <h2 className="font-medium text-slate-900">{task.title}</h2>
                                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[task.status]}`}
                                    >
                                        {statusLabels[task.status]}
                                    </span>
                                </div>

                                {task.description && (
                                    <p className="mt-2 text-sm text-slate-600">{task.description}</p>
                                )}

                                {task.tags.length > 0 && (
                                    <ul className="mt-3 flex flex-wrap gap-1.5">
                                        {task.tags.map((tag) => (
                                            <li 
                                                key={tag}
                                                className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                                            >
                                                {tag}
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                <p className="mt-3 text-xs text-slate-400">
                                    {new Date(task.createdAt).toLocaleString("ru-RU")}
                                </p>
                            </li>
                    ))}
                </ul>
            </section>
        </main>
    );
}