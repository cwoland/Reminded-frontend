"use client";

import { useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { AppShell } from "@/components/shell/AppShell";
import { OrbitScene } from "@/components/scene/OrbitScene";
import { Button } from "@/components/ui/Button";
import { CreateTaskForm } from "@/components/CreateTaskForm";
import { TaskCard } from "@/components/TaskCard";
import { useGetTasksQuery } from "@/lib/api/tasksApi";
import { useAuthStore } from "@/store/auth";

type View = "scene" | "list";

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

  const [view, setView] = useState<View>("scene");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: tasks, isLoading, error } = useGetTasksQuery();

  return (
    <AppShell
      title={view === "scene" ? "Орбиты" : "Список"}
      meta={`${user?.username ?? ""} · ${tasks?.length ?? 0} задач`}
      actions={
        <>
          <div className="flex rounded-[var(--radius-md)] border border-line p-0.5">
            <button
              onClick={() => setView("scene")}
              className={`rounded-[6px] px-2.5 py-1 text-xs transition-colors duration-[var(--dur-hint)] ${
                view === "scene" ? "bg-surface-3 text-text" : "text-faint hover:text-muted"
              }`}
            >
              Сцена
            </button>
            <button
              onClick={() => setView("list")}
              className={`rounded-[6px] px-2.5 py-1 text-xs transition-colors duration-[var(--dur-hint)] ${
                view === "list" ? "bg-surface-3 text-text" : "text-faint hover:text-muted"
              }`}
            >
              Список
            </button>
          </div>
          <Button variant="ghost" onClick={logout}>
            Выйти
          </Button>
        </>
      }
    >
      {isLoading && <p className="meta">Синхронизация…</p>}
      {error && <p className="text-sm text-cancelled">Не удалось загрузить задачи</p>}

      {tasks && view === "scene" && (
        <OrbitScene tasks={tasks} selectedId={selectedId} onSelect={setSelectedId} />
      )}

      {tasks && view === "list" && (
        <div className="space-y-6">
          <CreateTaskForm />
          <ul className="space-y-3">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </ul>
        </div>
      )}
    </AppShell>
  );
}