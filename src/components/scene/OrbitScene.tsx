"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  TILT,
  groupProjects,
  layoutBodies,
  placeGroups,
  rings,
  tasksOfProject,
} from "@/lib/orbits";
import type { SceneFocus } from "@/lib/orbits";
import { useUpdateTaskMutation } from "@/lib/api/tasksApi";
import type { Project, Task } from "@/types/api";
import { TaskBody } from "./TaskBody";
import { ProjectBody } from "./ProjectBody";
import { TaskPopover } from "./TaskPopover";
import { ProjectDock, type DockTarget } from "./ProjectDock";
import { SceneBackdrop } from "./SceneBackdrop";
import { EmberField, type EmberFieldHandle, type EmberSource } from "./EmberField";

const DRAG_THRESHOLD = 5;

interface SpinState {
  pointerId: number;
  startX: number;
  lastX: number;
  velocity: number;
  captured: boolean;
}

interface DragTaskState {
  taskId: string;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  centerX: number;
  centerY: number;
  x: number;
  y: number;
  active: boolean;
  dockId?: string | null;
}

function buildDockTargets(
  focus: SceneFocus,
  projects: Project[],
  groups: { id: string | null; total: number }[]
): DockTarget[] {
  if (focus.kind !== "project") return [];

  const counts = new Map(groups.map((group) => [group.id, group.total]));

  const items: DockTarget[] = projects
    .filter((project) => project.id !== focus.id)
    .map((project) => ({
      id: project.id,
      title: project.title,
      color: project.color || "var(--accent)",
      total: counts.get(project.id) ?? 0,
    }));

  if (focus.id !== null) {
    items.push({
      id: null,
      title: "Без проекта",
      color: "#8a8172",
      total: counts.get(null) ?? 0,
    });
  }

  return items;
}

interface OrbitSceneProps {
  tasks: Task[];
  projects: Project[];
  focus: SceneFocus;
  onFocusChange: (focus: SceneFocus) => void;
  selectedTaskId: string | null;
  onSelectTask: (id: string) => void;
}

export function OrbitScene({
  tasks,
  projects,
  focus,
  onFocusChange,
  selectedTaskId,
  onSelectTask,
}: OrbitSceneProps) {
  const reduce = useReducedMotion();

  const [rotation, setRotation] = useState(-Math.PI / 2);
  const [isSpinning, setIsSpinning] = useState(false);
  const [dragTask, setDragTask] = useState<DragTaskState | null>(null);

  const [sceneSize, setSceneSize] = useState({ width: 800, height: 560 });

  const emberRef = useRef<EmberFieldHandle>(null);
  const rotationRef = useRef(-Math.PI / 2);
  const previousStatuses = useRef<Map<string, string>>(new Map());

  const sceneRef = useRef<HTMLDivElement>(null);
  const spinRef = useRef<SpinState | null>(null);
  const inertiaRef = useRef<number | null>(null);
  const suppressClick = useRef(false);

  const [updateTask] = useUpdateTaskMutation();

  const dockNodes = useRef(new Map<string, HTMLElement>());
  const dockRects = useRef<{ id: string | null; rect: DOMRect }[]>([]);

  function registerDockNode(key: string, node: HTMLElement | null) {
    if (node) dockNodes.current.set(key, node);
    else dockNodes.current.delete(key);
  }

  useEffect(() => {
    return () => {
      if (inertiaRef.current !== null) cancelAnimationFrame(inertiaRef.current);
    };
  }, []);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;

      if (dragTask) {
        setDragTask(null);
        suppressClick.current = true;
        return;
      }

      if (focus.kind === "project") {
        onFocusChange({ kind: "system" });
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [dragTask, focus, onFocusChange]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSceneSize({ width, height });
    });

    observer.observe(scene);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const previous = previousStatuses.current;
    const next = new Map<string, string>();

    let completed: Task | null = null;

    for (const task of tasks) {
      next.set(task.id, task.status);

      const before = previous.get(task.id);
      if (before && before !== "done" && task.status === "done") {
        completed = task;
      }
    }

    previousStatuses.current = next;

    if (!completed) return;

    const laid = layoutBodies(
      tasksOfProject(tasks, focus.kind === "project" ? focus.id : null),
      rotationRef.current
    );
    const body = laid.find((item) => item.task.id === completed.id);

    emberRef.current?.burst(body?.x ?? 0, body?.y ?? 0, "#ff9e2c");
  }, [tasks, focus]);

  function nearestRing(x: number, y: number) {
    const radius = Math.sqrt(x * x + (y / TILT) * (y / TILT));

    return rings.reduce((best, ring) =>
      Math.abs(ring.radius - radius) < Math.abs(best.radius - radius) ? ring : best
    );
  }

  function handleBodyPointerDown(taskId: string, event: React.PointerEvent<HTMLButtonElement>) {
    event.stopPropagation();

    const scene = sceneRef.current;
    if (!scene) return;

    if (inertiaRef.current !== null) cancelAnimationFrame(inertiaRef.current);

    const rect = scene.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    dockRects.current = dockTargets.flatMap((target) => {
      const node = dockNodes.current.get(target.id ?? "orphans");
      return node ? [{ id: target.id, rect: node.getBoundingClientRect() }] : [];
    });

    setDragTask({
      taskId,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      centerX,
      centerY,
      x: event.clientX - centerX,
      y: event.clientY - centerY,
      active: false,
    });
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (selectedTaskId) return;

    if (inertiaRef.current !== null) cancelAnimationFrame(inertiaRef.current);

    spinRef.current = { pointerId: event.pointerId, startX: event.clientX, lastX: event.clientX, velocity: 0, captured: false };
  }

    function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (dragTask && dragTask.pointerId === event.pointerId) {
      const dx = event.clientX - dragTask.startClientX;
      const dy = event.clientY - dragTask.startClientY;
      const active = dragTask.active || Math.hypot(dx, dy) > DRAG_THRESHOLD;

      if (active && !dragTask.active) {
        event.currentTarget.setPointerCapture(event.pointerId);
        suppressClick.current = true;
      }

      const hit = active
        ? dockRects.current.find(
            ({ rect }) =>
              event.clientX >= rect.left &&
              event.clientX <= rect.right &&
              event.clientY >= rect.top &&
              event.clientY <= rect.bottom
          )
        : undefined;

      setDragTask({
        ...dragTask,
        x: event.clientX - dragTask.centerX,
        y: event.clientY - dragTask.centerY,
        active,
        dockId: hit ? hit.id : undefined,
      });
      return;
    }

    const spin = spinRef.current;
    if (!spin || spin.pointerId !== event.pointerId) return;

    if (!spin.captured) {
      if (Math.abs(event.clientX - spin.startX) <= DRAG_THRESHOLD) return;

      event.currentTarget.setPointerCapture(event.pointerId);
      spin.captured = true;
      setIsSpinning(true);
    }

    const delta = -(event.clientX - spin.lastX) * 0.006;
    spin.lastX = event.clientX;
    spin.velocity = delta;

    setRotation((current) => {
      const next = current + delta;
      rotationRef.current = next;
      return next;
    });
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (dragTask && dragTask.pointerId === event.pointerId) {
      if (dragTask.active) {
        if (dragTask.dockId !== undefined) {
          updateTask({ id: dragTask.taskId, patch: { projectId: dragTask.dockId } });
        } else {
        const target = nearestRing(dragTask.x, dragTask.y);
        const task = tasks.find((item) => item.id === dragTask.taskId);

        if (task && task.status !== target.status) {
          updateTask({ id: task.id, patch: { status: target.status } });
        }
      }
    }

      setDragTask(null);
      setTimeout(() => {
        suppressClick.current = false;
      }, 0);
      return;
    }

    const spin = spinRef.current;
    if (!spin || spin.pointerId !== event.pointerId) return;

    let velocity = spin.velocity;
    spinRef.current = null;

    if (reduce || Math.abs(velocity) < 0.0015) {
      setIsSpinning(false);
      return;
    }

    let previous = performance.now();

    function step(now: number) {
      const dt = Math.min(now - previous, 50);
      previous = now;
      const frames = dt / 16.67;

      setRotation((current) => {
        const next = current + velocity * frames;
        rotationRef.current = next;
        return next;
      });
      velocity *= Math.pow(0.94, frames);

      if (Math.abs(velocity) > 0.0004) {
        inertiaRef.current = requestAnimationFrame(step);
      } else {
        setIsSpinning(false);
      }
    }

    inertiaRef.current = requestAnimationFrame(step);
  }

  const groups = useMemo(() => groupProjects(projects, tasks), [projects, tasks]);

  const dockTargets = buildDockTargets(focus, projects, groups);


  const planets = placeGroups(groups, rotation);

  const focusedProject =
    focus.kind === "project" && focus.id ? projects.find((p) => p.id === focus.id) : undefined;
  const focusedTasks = focus.kind === "project" ? tasksOfProject(tasks, focus.id) : [];
  const bodies = layoutBodies(focusedTasks, rotation);

  const targetRing = dragTask?.active && dragTask.dockId === undefined ? nearestRing(dragTask.x, dragTask.y) : null;

  const renderedBodies = bodies.map((body) =>
    dragTask?.active && body.task.id === dragTask.taskId
      ? { ...body, x: dragTask.x, y: dragTask.y, depth: 1, scale: 1.08 }
      : body
  );

    const emberSources: EmberSource[] =
    focus.kind === "system"
      ? planets
          .filter((planet) => planet.active > 0)
          .map((planet) => ({ x: planet.x, y: planet.y, color: planet.color }))
      : renderedBodies
          .filter((body) => body.task.status === "in_progress")
          .map((body) => ({ x: body.x, y: body.y, color: "#ff9e2c" }));

    const anchorBody = selectedTaskId
    ? bodies.find((body) => body.task.id === selectedTaskId)
    : undefined;

  const anchor = anchorBody ? { x: anchorBody.x, y: anchorBody.y } : null;

  const sceneWidth = sceneSize.width;
  const sceneHeight = sceneSize.height;

  const enter = reduce ? { opacity: 0 } : { opacity: 0, transform: "scale(0.93)" };
  const shown = reduce ? { opacity: 1 } : { opacity: 1, transform: "scale(1)" };
  const leave = reduce ? { opacity: 0 } : { opacity: 0, transform: "scale(1.35)" };

  return (
    <div className="relative">
      <AnimatePresence>
        {focus.kind === "project" && (
          <motion.button
            key="back"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => onFocusChange({ kind: "system" })}
            className="absolute left-0 top-0 z-10 flex items-center gap-2 rounded-[var(--radius-md)] border border-line px-3 py-1.5 text-xs text-muted transition-colors duration-[var(--dur-hint)] hover:border-line-strong hover:text-text"
          >
            ← Все проекты
            <kbd className="meta">esc</kbd>
          </motion.button>
        )}
      </AnimatePresence>

      <div
        ref={sceneRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative h-[560px] w-full cursor-grab touch-none select-none active:cursor-grabbing"
      >
        <AnimatePresence initial={false}>
          <SceneBackdrop rotation={rotation} />
          <EmberField ref={emberRef} sources={emberSources} />
          {focus.kind === "system" ? (
            <motion.div
              key="system"
              initial={enter}
              animate={shown}
              exit={leave}
              transition={{ duration: 0.52, ease: [0.77, 0, 0.175, 1] }}
              className="absolute inset-0"
            >
              <div className="absolute left-1/2 top-1/2">
                <div
                  aria-hidden
                  className="absolute rounded-[50%] border border-line"
                  style={{
                    width: 236 * 2,
                    height: 236 * 2 * TILT,
                    transform: "translate(-50%, -50%)",
                  }}
                />

                <div
                  aria-hidden
                  className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent"
                  style={{ boxShadow: "var(--glow)" }}
                />

                {planets.map((planet) => (
                  <ProjectBody
                    key={planet.id ?? "orphans"}
                    planet={planet}
                    isSpinning={isSpinning}
                    onFocus={(id) => onFocusChange({ kind: "project", id })}
                  />
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="project"
              initial={enter}
              animate={shown}
              exit={leave}
              transition={{ duration: 0.52, ease: [0.77, 0, 0.175, 1] }}
              className="absolute inset-0"
            >
              <div className="absolute left-1/2 top-1/2">
                {rings.map(({ status, radius }) => {
                  const isTarget = targetRing?.status === status;

                  return (
                    <div
                      key={status}
                      aria-hidden
                      className="absolute rounded-[50%] border transition-[border-color,box-shadow] duration-[var(--dur-hint)] ease-[var(--ease-out-strong)]"
                      style={{
                        width: radius * 2,
                        height: radius * 2 * TILT,
                        transform: "translate(-50%, -50%)",
                        borderStyle: status === "in_progress" ? "solid" : "dashed",
                        borderColor: isTarget
                          ? "var(--accent)"
                          : status === "in_progress"
                            ? "color-mix(in oklab, var(--accent) 45%, transparent)"
                            : "var(--line-strong)",
                        boxShadow: isTarget
                          ? "0 0 28px -6px color-mix(in oklab, var(--accent) 85%, transparent)"
                          : status === "in_progress"
                            ? "var(--glow-soft)"
                            : undefined,
                      }}
                    />
                  );
                })}

                <div
                  aria-hidden
                  className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{
                    background: focusedProject?.color ?? "var(--accent)",
                    boxShadow: `0 0 40px -4px ${focusedProject?.color ?? "#ff9e2c"}`,
                  }}
                />

                <span className="absolute -translate-x-1/2 translate-y-5 whitespace-nowrap text-[13px] text-muted">
                  {focusedProject?.title ?? "Без проекта"}
                </span>

                {renderedBodies.map((body) => (
                  <TaskBody
                    key={body.task.id}
                    body={body}
                    isSelected={body.task.id === selectedTaskId}
                    isSpinning={isSpinning}
                    isDragging={dragTask?.active === true && dragTask.taskId === body.task.id}
                    onSelect={(id) => {
                      if (!suppressClick.current) onSelectTask(id);
                    }}
                    onDragStart={handleBodyPointerDown}
                  />
                ))}
              </div>

              <TaskPopover
                taskId={selectedTaskId}
                anchor={anchor}
                sceneWidth={sceneWidth}
                sceneHeight={sceneHeight}
                onClose={() => onSelectTask("")}
              />

              <ProjectDock
                targets={dockTargets}
                isDragging={dragTask?.active === true}
                activeId={dragTask?.dockId}
                onNavigate={(id) => onFocusChange({ kind: "project", id })}
                registerNode={registerDockNode}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}