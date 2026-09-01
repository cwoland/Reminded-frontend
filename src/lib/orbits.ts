import type { Project, Task, TaskStatus } from "@/types/api";
import type { OrbitPosition } from "./scene/positions";

export const TILT = 0.42;
export const PROJECT_ORBIT = 236;

export const rings: { status: TaskStatus; radius: number; label: string }[] = [
    { status: "in_progress", radius: 132, label: "В работе" },
    { status: "planned", radius: 216, label: "Запланировано" },
    { status: "done", radius: 296, label: "Готово" },
    { status: "cancelled", radius: 366, label: "Отменено" },
];

export interface OrbitBody {
    task: Task;
    x: number;
    y: number;
    depth: number;
    scale: number;
    pinned?: boolean;
}

export interface ProjectPlanet {
    id: string | null;
    title: string;
    color: string;
    total: number;
    active: number;
    x: number;
    y: number;
    depth: number;
    scale: number;
    size: number;
    pinned?: boolean;
}

export interface ProjectGroup {
  id: string | null;
  title: string;
  color: string;
  total: number;
  active: number;
}

export type SceneFocus = { kind: "system" } | { kind: "project"; id: string | null };

export function tasksOfProject(tasks: Task[], projectId: string | null): Task[] {
  return tasks.filter((task) => (projectId === null ? !task.projectId : task.projectId === projectId));
}

export function groupProjects(projects: Project[], tasks: Task[]): ProjectGroup[] {
  const byProject = new Map<string | null, Task[]>();

  for (const task of tasks) {
    const key = task.projectId ?? null;
    const bucket = byProject.get(key);
    if (bucket) bucket.push(task);
    else byProject.set(key, [task]);
  }

  const groups: ProjectGroup[] = projects.map((project) => {
    const own = byProject.get(project.id) ?? [];
    return {
      id: project.id,
      title: project.title,
      color: project.color || "#4db8ff",
      total: own.length,
      active: own.filter((task) => task.status === "in_progress").length,
    };
  });

  const orphans = byProject.get(null) ?? [];
  if (orphans.length > 0) {
    groups.push({
      id: null,
      title: "Без проекта",
      color: "#5d6b7a",
      total: orphans.length,
      active: orphans.filter((task) => task.status === "in_progress").length,
    });
  }

  return groups;
}

export function placeGroups(
  groups: ProjectGroup[],
  rotation: number,
  custom: Record<string, OrbitPosition> = {}
): ProjectPlanet[] {
  const step = (Math.PI * 2) / Math.max(groups.length, 1);

  return groups.map((group, index) => {
    const key = group.id ?? "orphans";
    const saved = custom[key];

    const { x, y, depth } = saved
      ? place(saved, rotation)
      : (() => {
          const angle = rotation + index * step;
          const d = Math.sin(angle);
          return {
            x: Math.cos(angle) * PROJECT_ORBIT,
            y: d * PROJECT_ORBIT * TILT,
            depth: d,
          };
        })();

    return {
      ...group,
      x,
      y,
      depth,
      scale: 0.86 + (depth + 1) * 0.09,
      size: 30 + Math.min(group.total, 12) * 2.4,
      pinned: Boolean(saved),
    };
  });
}

export function toOrbitPosition(x: number, y: number, rotation: number): OrbitPosition {
  const flatY = y / TILT;

  return {
    radius: Math.sqrt(x * x + flatY * flatY),
    angle: Math.atan2(flatY, x) - rotation,
  };
}

function place(position: OrbitPosition, rotation: number) {
  const angle = rotation + position.angle;
  const depth = Math.sin(angle);

  return {
    x: Math.cos(angle) * position.radius,
    y: depth * position.radius * TILT,
    depth,
  };
}

export function layoutBodies(
  tasks: Task[],
  rotation: number,
  custom: Record<string, OrbitPosition> = {}
): OrbitBody[] {
  return rings.flatMap(({ status, radius }) => {
    const ringTasks = tasks.filter((task) => task.status === status);
    const step = (Math.PI * 2) / Math.max(ringTasks.length, 1);

    return ringTasks.map((task, index) => {
      const saved = custom[task.id];

      const { x, y, depth } = saved
        ? place(saved, rotation)
        : (() => {
            const angle = rotation + index * step;
            const d = Math.sin(angle);
            return { x: Math.cos(angle) * radius, y: d * radius * TILT, depth: d };
          })();

      return {
        task,
        x,
        y,
        depth,
        scale: 0.84 + (depth + 1) * 0.1,
        pinned: Boolean(saved),
      };
    });
  });
}