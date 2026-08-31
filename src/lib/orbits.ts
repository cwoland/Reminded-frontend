import type { Task, TaskStatus } from "@/types/api";

export const TILT = 0.42;

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
}

export function layoutBodies(tasks: Task[], rotation: number): OrbitBody[] {
    return rings.flatMap(({ status, radius }) => {
        const ringTasks = tasks.filter((task) => task.status === status);
        const step = (Math.PI * 2) / Math.max(ringTasks.length, 1);

        return ringTasks.map((task, index) => {
            const angle = rotation + index * step;
            const depth = Math.sin(angle);

            return {
                task,
                x: Math.cos(angle) * radius,
                y: depth * radius * TILT,
                depth,
                scale: 0.84 + (depth + 1) * 0.1,
            };
        });
    });
}