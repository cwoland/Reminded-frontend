"use client";

import { useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { AppShell } from "@/components/shell/AppShell";
import { OrbitScene } from "@/components/scene/OrbitScene";
import { Button } from "@/components/ui/Button";
import { CreateTaskForm } from "@/components/CreateTaskForm";
import { CreateProjectForm } from "@/components/project/CreateProjectForm";
import { TaskCard } from "@/components/TaskCard";
import { logout } from "@/store/auth";
import { useGetTasksQuery, useGetProjectsQuery } from "@/lib/api/tasksApi";
import { useAuthStore } from "@/store/auth";
import type { SceneFocus } from "@/lib/orbits";
import { StatsRail } from "@/components/shell/StatsRail";
import { HudFrame } from "@/components/shell/HudFrame";
import { ImageBackdrop } from "@/components/shell/ImageBackdrop";
import { HoloModal } from "@/components/ui/HoloModal";
import { ProjectListContent } from "@/components/project/ProjectListModal";
import { ProjectDetails } from "@/components/project/ProjectDetails";

type View = "scene" | "list";

type Modal = { kind: "projects" } | { kind: "project"; id: string } | null;

export default function TasksPage() {
  return (
    <AuthGuard>
      <TasksScreen />
    </AuthGuard>
  );
}

function TasksScreen() {
  const user = useAuthStore((s) => s.user);

  const [view, setView] = useState<View>("scene");
  const [focus, setFocus] = useState<SceneFocus>({ kind: "system" });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openProjectId, setOpenProjectId] = useState<string | null>(null);
  const [modal, setModal] = useState<Modal>(null);

  const { data: tasks, isLoading, error } = useGetTasksQuery();
  const { data: projects } = useGetProjectsQuery();

  return (
    <AppShell
      title={view === "scene" ? "Орбиты" : "Список"}
      meta={`${user?.username ?? ""} · ${projects?.length ?? 0} проектов · ${tasks?.length ?? 0} задач`}
      actions={
        <>
        <div className="flex rounded-[var(--radius-md)] border border-line p-0.5">
          <button
            onClick={() => setView("scene")}
            className={`rounded-[6px] px-2.5 py-1 text-xs transition-colors duration-[var(--dur-hint)] ${view === "scene" ? "bg-surface-3 text-text" : "text-faint hover:text-muted"}`}
          >
            Сцена
          </button>
          <button
            onClick={() => setView("list")}
            className={`rounded-[6px] px-2.5 py-1 text-xs transition-colors duration-[var(--dur-hint)] ${view === "list" ? "bg-surface-3 text-text" : "text-faint hover:text-muted"}`}
          >
            Список
          </button>
        </div>
        <Button variant="ghost" onClick={logout}>Выйти</Button>
        </>
      }
    >
      {isLoading && <p className="meta">Синхронизация…</p>}
      {error && <p className="text-sm text-cancelled">Не удалось загрузить задачи</p>}

      {tasks && tasks.length === 0 && view === "scene" && (
        <div className="flex h-[560px] flex-col items-center justify-center gap-3 text-center">
          <p className="text-sm text-muted">Система пуста</p>
          <p className="max-w-xs text-xs text-faint">
            Создайте первый проект и задачу в режиме «Список» — они появятся здесь как планеты
          </p>
          <Button variant="outline" onClick={() => setModal({ kind: "projects" })}>
            Перейти к списку
          </Button>
        </div>
      )}

      {tasks && tasks.length > 0 && view === "scene" && (
        <div className="grid gap-5 lg:grid-cols-[176px_1fr]">
          <StatsRail tasks={tasks} projects={projects ?? []} onSelectTask={setSelectedId} />

          <HudFrame
            label={focus.kind === "system" ? "система" : "проект"}
            meta={`орбит: ${focus.kind === "system" ? projects?.length ?? 0 : 4}`}
          >
            <OrbitScene
              tasks={tasks}
              projects={projects ?? []}
              focus={focus}
              onFocusChange={(next) => {
                setFocus(next);
                setSelectedId(null);
                setModal(next.kind === "project" && next.id ? { kind: "project", id: next.id } : null);
              }}
              selectedTaskId={selectedId}
              onSelectTask={setSelectedId}
            />
          </HudFrame>
        </div>
      )}

      {tasks && view === "list" && (
        <div className="space-y-6">
          <ImageBackdrop src="/JARVIS-2.jpg" />
          <CreateProjectForm />
          <CreateTaskForm />
          <ul className="space-y-3">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </ul>
        </div>
      )}

      <HoloModal
        open={modal?.kind === "projects"}
        label="проекты"
        meta={`${projects?.length ?? 0}`}
        width={620}
        onClose={() => setModal(null)}
      >
        <ProjectListContent
          projects={projects ?? []}
          tasks={tasks ?? []}
          onOpenProject={(id) => {
            setModal({ kind: "project", id });
            setFocus({ kind: "project", id });
          }}
        />
      </HoloModal>

      <HoloModal
        open={modal?.kind === "project"}
        label="проект"
        width={560}
        onClose={() => setModal(null)}
      >
        {modal?.kind === "project" &&
          (() => {
            const project = (projects ?? []).find((item) => item.id === modal.id);
            if (!project) return null;

            return (
              <ProjectDetails
                project={project}
                tasks={tasks ?? []}
                onSelectTask={(id) => {
                  setModal(null);
                  setSelectedId(id);
                }}
                onDeleted={() => setModal(null)}
              />
            );
          })()}
      </HoloModal>
    </AppShell>
  );
}