"use client";

import { statusLabels } from "@/lib/status";
import { dueBucket } from "@/lib/deadline";
import { formatMinutes, totalMinutes } from "@/lib/duration";
import { CreateProjectForm } from "./CreateProjectForm";
import type { Project, Task } from "@/types/api";

interface ProjectListModalProps {
  projects: Project[];
  tasks: Task[];
  onOpenProject: (id: string) => void;
}

export function ProjectListContent({ projects, tasks, onOpenProject }: ProjectListModalProps) {
  return (
    <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
      {projects.length === 0 ? (
        <p className="text-xs text-faint">Проектов пока нет — создайте первый</p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {projects.map((project) => {
            const own = tasks.filter((task) => task.projectId === project.id);
            const active = own.filter((task) => task.status === "in_progress").length;
            const overdue = own.filter((task) => dueBucket(task) === "overdue").length;
            const spent = own.reduce((sum, task) => sum + totalMinutes(task), 0);

            return (
              <li key={project.id}>
                <button
                  type="button"
                  onClick={() => onOpenProject(project.id)}
                  className="flex w-full flex-col gap-2 rounded-[var(--radius-md)] border border-line bg-surface-2/50 p-3 text-left transition-[border-color,background-color,transform] duration-[var(--dur-hint)] ease-[var(--ease-out-strong)] hover:border-accent/60 hover:bg-surface-2 active:scale-[0.99]"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{
                        background: project.color,
                        boxShadow: active > 0 ? `0 0 12px ${project.color}` : undefined,
                      }}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm text-text">
                      {project.title}
                    </span>
                    <span className="meta tabular-nums">{own.length}</span>
                  </span>

                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    {active > 0 && (
                      <span className="text-[11px] text-progress">
                        {statusLabels.in_progress}: {active}
                      </span>
                    )}
                    {overdue > 0 && (
                      <span className="text-[11px] text-cancelled">просрочено: {overdue}</span>
                    )}
                    {spent > 0 && <span className="meta">{formatMinutes(spent)}</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div>
        <p className="meta mb-2">Новый проект</p>
        <CreateProjectForm />
      </div>
    </div>
  );
}