"use client";

import { useState, useCallback } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { AppShell } from "@/components/shell/AppShell";
import { OrbitScene } from "@/components/scene/OrbitScene";
import { Button } from "@/components/ui/Button";
import { CreateTaskForm } from "@/components/CreateTaskForm";
import { CreateProjectForm } from "@/components/project/CreateProjectForm";
import { TaskCard } from "@/components/TaskCard";
import { logout } from "@/store/auth";
import {
  useGetTasksQuery,
  useGetProjectsQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useAddCommentMutation,
} from "@/lib/api/tasksApi";
import { useAuthStore } from "@/store/auth";
import type { SceneFocus } from "@/lib/orbits";
import { StatsRail } from "@/components/shell/StatsRail";
import { HudFrame } from "@/components/shell/HudFrame";
import { ImageBackdrop } from "@/components/shell/ImageBackdrop";
import { HoloModal } from "@/components/ui/HoloModal";
import { ProjectListContent } from "@/components/project/ProjectListModal";
import { ProjectDetails } from "@/components/project/ProjectDetails";
import { statusLabels } from "@/lib/status";
import { dueBucket, formatDue } from "@/lib/deadline";
import { formatMinutes, totalMinutes } from "@/lib/duration";

import { VoiceControl } from "@/components/voice/VoiceControl";
import type { Intent } from "@/lib/voice/parser";
import type { CommandId } from "@/lib/voice/commands";

type View = "scene" | "list";

type Modal = { kind: "projects" } | { kind: "project"; id: string } | null;

type IntentOutcome = { command: CommandId; values: Record<string, string> };

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
  const [modal, setModal] = useState<Modal>(null);

  const { data: tasks, isLoading, error } = useGetTasksQuery();
  const { data: projects } = useGetProjectsQuery();

  const [createTask] = useCreateTaskMutation();
  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();
  const [addComment] = useAddCommentMutation();

  const handleIntent = useCallback(
    async (intent: Intent): Promise<IntentOutcome> => {
      const allTasks = tasks ?? [];

      /** Задача, с которой работают короткие команды */
      const openTask = allTasks.find((task) => task.id === selectedId);

      switch (intent.kind) {
        case "show_projects":
          setModal({ kind: "projects" });
          return { command: "show_projects", values: {} };

        case "go_back":
          setFocus({ kind: "system" });
          setModal(null);
          setSelectedId(null);
          return { command: "go_back", values: {} };

        case "open_project":
          setFocus({ kind: "project", id: intent.projectId });
          setModal({ kind: "project", id: intent.projectId });
          return { command: "open_project", values: { name: intent.title } };

        case "open_task": {
          const task = allTasks.find((item) => item.id === intent.taskId);

          setFocus({ kind: "project", id: task?.projectId ?? null });
          setSelectedId(intent.taskId);
          return { command: "open_task", values: { name: intent.title } };
        }

        case "set_status":
          await updateTask({ id: intent.taskId, patch: { status: intent.status } }).unwrap();

          return {
            command: "set_status",
            values: { name: intent.title, status: statusLabels[intent.status] },
          };

        case "create_task":
          await createTask({
            title: intent.title,
            ...(intent.projectId ? { projectId: intent.projectId } : {}),
            ...(intent.dueDate ? { dueDate: intent.dueDate } : {}),
          }).unwrap();

          return {
            command: "create_task",
            values: {
              name: intent.title,
              project: intent.projectTitle ?? "",
              due: intent.dueDate ? formatDue(intent.dueDate) : "",
            },
          };

        // ——— команды для открытой задачи ———

        case "context_status": {
          if (!openTask) return { command: "no_context", values: {} };

          await updateTask({ id: openTask.id, patch: { status: intent.status } }).unwrap();

          return {
            command: "context_status",
            values: { name: openTask.title, status: statusLabels[intent.status] },
          };
        }

        case "context_due": {
          if (!openTask) return { command: "no_context", values: {} };

          await updateTask({ id: openTask.id, patch: { dueDate: intent.dueDate } }).unwrap();

          return {
            command: "context_due",
            values: { name: openTask.title, due: formatDue(intent.dueDate) },
          };
        }

        case "context_delete": {
          if (!openTask) return { command: "no_context", values: {} };

          await deleteTask(openTask.id).unwrap();
          setSelectedId(null);

          return { command: "context_delete", values: { name: openTask.title } };
        }

        case "add_comment": {
          if (!openTask) return { command: "no_context", values: {} };

          await addComment({ taskId: openTask.id, body: intent.body }).unwrap();

          return { command: "add_comment", values: { name: openTask.title } };
        }

        // ——— запросы ———

        case "query_overdue": {
          const overdue = allTasks.filter((task) => dueBucket(task) === "overdue");

          return {
            command: "query_overdue",
            values: {
              count: String(overdue.length),
              list: overdue.slice(0, 3).map((task) => task.title).join(", "),
            },
          };
        }

        case "query_in_progress": {
          const active = allTasks.filter((task) => task.status === "in_progress");

          return {
            command: "query_in_progress",
            values: {
              count: String(active.length),
              list: active.slice(0, 3).map((task) => task.title).join(", "),
            },
          };
        }

        case "query_spent": {
          const scope = intent.projectId
            ? allTasks.filter((task) => task.projectId === intent.projectId)
            : allTasks;

          const minutes = scope.reduce((sum, task) => sum + totalMinutes(task), 0);

          return {
            command: "query_spent",
            values: {
              time: formatMinutes(minutes),
              project: intent.projectTitle ? ` на «${intent.projectTitle}»` : "",
            },
          };
        }
      }
    },
    [tasks, selectedId, createTask, updateTask, deleteTask, addComment]
  );

  return (
    <AppShell
      title={view === "scene" ? "Орбита" : "Список"}
      meta={`${user?.username ?? ""} · ${projects?.length ?? 0} проектов · ${tasks?.length ?? 0} задач`}
      actions={
        <>
        <div className="flex rounded-[var(--radius-md)] border border-line p-0.5">
          <button
            onClick={() => setView("scene")}
            className={`rounded-[6px] px-2.5 py-1 text-xs transition-colors duration-[var(--dur-hint)] ${view === "scene" ? "bg-surface-3 text-text" : "text-faint hover:text-muted"}`}
          >
            Орбита
          </button>
          <button
            onClick={() => setView("list")}
            className={`rounded-[6px] px-2.5 py-1 text-xs transition-colors duration-[var(--dur-hint)] ${view === "list" ? "bg-surface-3 text-text" : "text-faint hover:text-muted"}`}
          >
            Список
          </button>
        </div>

        <VoiceControl
          onIntent={handleIntent}
          hasTaskContext={selectedId !== null}
          projects={projects ?? []}
          tasks={tasks ?? []}
        />

        <Button variant="outline" onClick={() => setModal({ kind: "projects" })}>
          Проекты
        </Button>
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
            Создайте первый проект и задачу в режиме «Список» — они появятся здесь
          </p>
          <Button variant="outline" onClick={() => setView("list")}>
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