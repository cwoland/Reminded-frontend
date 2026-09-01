"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  TILT,
  groupProjects,
  layoutBodies,
  placeGroups,
  rings,
  tasksOfProject,
  toOrbitPosition,
} from "@/lib/orbits";
import type { SceneFocus } from "@/lib/orbits";
import {
  clearPosition,
  getEmptyPositions,
  getPositions,
  savePosition,
  subscribePositions,
} from "@/lib/scene/positions";
import { useUpdateTaskMutation } from "@/lib/api/tasksApi";
import type { Project, Task } from "@/types/api";
import { TaskBody } from "./TaskBody";
import { ProjectBody } from "./ProjectBody";
import { TaskPopover } from "./TaskPopover";
import { ProjectDock, type DockTarget } from "./ProjectDock";
import { SceneBackdrop } from "./SceneBackdrop";
import { EmberField, type EmberFieldHandle, type EmberSource } from "./EmberField";

const DRAG_THRESHOLD = 5;
const SNAP_DISTANCE = 26;

interface SpinState {
  pointerId: number;
  startX: number;
  lastX: number;
  velocity: number;
  captured: boolean;
}

interface DragState {
  kind: "task" | "project";
  /** id задачи или проекта; для «Без проекта» — "orphans" */
  id: string;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  centerX: number;
  centerY: number;
  /** смещение точки захвата от центра тела */
  grabX: number;
  grabY: number;
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
  const [drag, setDrag] = useState<DragState | null>(null);
  const [sceneSize, setSceneSize] = useState({ width: 800, height: 560 });

  const sceneRef = useRef<HTMLDivElement>(null);
  const spinRef = useRef<SpinState | null>(null);
  const inertiaRef = useRef<number | null>(null);
  const suppressClick = useRef(false);
  const emberRef = useRef<EmberFieldHandle>(null);
  const rotationRef = useRef(-Math.PI / 2);
  const previousStatuses = useRef<Map<string, string>>(new Map());

  const dockNodes = useRef(new Map<string, HTMLElement>());
  const dockRects = useRef<{ id: string | null; rect: DOMRect }[]>([]);

  const [updateTask] = useUpdateTaskMutation();

  const positions = useSyncExternalStore(subscribePositions, getPositions, getEmptyPositions);

  // ——— раскладка ———

  const groups = useMemo(() => groupProjects(projects, tasks), [projects, tasks]);
  const dockTargets = buildDockTargets(focus, projects, groups);

  const planets = placeGroups(groups, rotation, positions.projects);

  const focusedProject =
    focus.kind === "project" && focus.id ? projects.find((p) => p.id === focus.id) : undefined;
  const focusedTasks = focus.kind === "project" ? tasksOfProject(tasks, focus.id) : [];
  const bodies = layoutBodies(focusedTasks, rotation, positions.tasks);

  // ——— эффекты ———

  useEffect(() => {
    return () => {
      if (inertiaRef.current !== null) cancelAnimationFrame(inertiaRef.current);
    };
  }, []);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;

      if (drag) {
        setDrag(null);
        suppressClick.current = true;
        return;
      }

      if (focus.kind === "project") {
        onFocusChange({ kind: "system" });
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [drag, focus, onFocusChange]);

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

  // ——— геометрия ———

  function nearestRing(x: number, y: number) {
    const radius = Math.sqrt(x * x + (y / TILT) * (y / TILT));

    return rings.reduce((best, ring) =>
      Math.abs(ring.radius - radius) < Math.abs(best.radius - radius) ? ring : best
    );
  }

  function spin(delta: number) {
    setRotation((current) => {
      const next = current + delta;
      rotationRef.current = next;
      return next;
    });
  }

  // ——— перетаскивание тел ———

  function beginDrag(
    kind: "task" | "project",
    rawId: string | null,
    event: React.PointerEvent<HTMLButtonElement>
  ) {
    event.stopPropagation();

    const scene = sceneRef.current;
    if (!scene) return;

    if (inertiaRef.current !== null) cancelAnimationFrame(inertiaRef.current);

    const id = rawId ?? "orphans";

    const source =
      kind === "task"
        ? bodies.find((body) => body.task.id === id)
        : planets.find((planet) => (planet.id ?? "orphans") === id);

    if (!source) return;

    const rect = scene.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // за какую точку тела взялись — чтобы оно не прыгало под курсор
    const grabX = source.x - (event.clientX - centerX);
    const grabY = source.y - (event.clientY - centerY);

    dockRects.current =
      kind === "task"
        ? dockTargets.flatMap((target) => {
            const node = dockNodes.current.get(target.id ?? "orphans");
            return node ? [{ id: target.id, rect: node.getBoundingClientRect() }] : [];
          })
        : [];

    setDrag({
      kind,
      id,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      centerX,
      centerY,
      grabX,
      grabY,
      x: source.x,
      y: source.y,
      active: false,
    });
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (selectedTaskId) return;

    if (inertiaRef.current !== null) cancelAnimationFrame(inertiaRef.current);

    spinRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      lastX: event.clientX,
      velocity: 0,
      captured: false,
    };
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (drag && drag.pointerId === event.pointerId) {
      const dx = event.clientX - drag.startClientX;
      const dy = event.clientY - drag.startClientY;
      const active = drag.active || Math.hypot(dx, dy) > DRAG_THRESHOLD;

      if (active && !drag.active) {
        event.currentTarget.setPointerCapture(event.pointerId);
        suppressClick.current = true;
      }

      const hit =
        active && drag.kind === "task"
          ? dockRects.current.find(
              ({ rect }) =>
                event.clientX >= rect.left &&
                event.clientX <= rect.right &&
                event.clientY >= rect.top &&
                event.clientY <= rect.bottom
            )
          : undefined;

      setDrag({
        ...drag,
        x: event.clientX - drag.centerX + drag.grabX,
        y: event.clientY - drag.centerY + drag.grabY,
        active,
        dockId: hit ? hit.id : undefined,
      });
      return;
    }

    const state = spinRef.current;
    if (!state || state.pointerId !== event.pointerId) return;

    if (!state.captured) {
      if (Math.abs(event.clientX - state.startX) <= DRAG_THRESHOLD) return;

      event.currentTarget.setPointerCapture(event.pointerId);
      state.captured = true;
      setIsSpinning(true);
    }

    const delta = -(event.clientX - state.lastX) * 0.006;
    state.lastX = event.clientX;
    state.velocity = delta;

    spin(delta);
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (drag && drag.pointerId === event.pointerId) {
      if (drag.active) dropBody(drag);

      setDrag(null);
      setTimeout(() => {
        suppressClick.current = false;
      }, 0);
      return;
    }

    const state = spinRef.current;
    if (!state || state.pointerId !== event.pointerId) return;

    let velocity = state.velocity;
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

      spin(velocity * frames);
      velocity *= Math.pow(0.94, frames);

      if (Math.abs(velocity) > 0.0004) {
        inertiaRef.current = requestAnimationFrame(step);
      } else {
        setIsSpinning(false);
      }
    }

    inertiaRef.current = requestAnimationFrame(step);
  }

  /** Что происходит, когда тело отпустили */
  function dropBody(state: DragState) {
    const { x, y } = state;

    if (state.kind === "project") {
      savePosition("projects", state.id, toOrbitPosition(x, y, rotationRef.current));
      return;
    }

    // док важнее всего: это перенос в другой проект
    if (state.dockId !== undefined) {
      updateTask({ id: state.id, patch: { projectId: state.dockId } });
      clearPosition("tasks", state.id);
      return;
    }

    const flatY = y / TILT;
    const radius = Math.sqrt(x * x + flatY * flatY);
    const ring = nearestRing(x, y);

    if (Math.abs(radius - ring.radius) <= SNAP_DISTANCE) {
      // рядом с кольцом — примагничиваем и меняем статус
      const task = tasks.find((item) => item.id === state.id);

      if (task && task.status !== ring.status) {
        updateTask({ id: task.id, patch: { status: ring.status } });
      }

      clearPosition("tasks", state.id);
      return;
    }

    // отпустили в стороне — оставляем там, где отпустили
    savePosition("tasks", state.id, toOrbitPosition(x, y, rotationRef.current));
  }

  function resetPosition(kind: "tasks" | "projects", rawId: string | null) {
    clearPosition(kind, rawId ?? "orphans");
  }

  function registerDockNode(key: string, node: HTMLElement | null) {
    if (node) dockNodes.current.set(key, node);
    else dockNodes.current.delete(key);
  }

  // ——— то, что рисуем ———

  const draggingTaskId = drag?.active && drag.kind === "task" ? drag.id : null;
  const draggingProjectId = drag?.active && drag.kind === "project" ? drag.id : null;

  const renderedBodies = bodies.map((body) =>
    body.task.id === draggingTaskId
      ? { ...body, x: drag!.x, y: drag!.y, depth: 1, scale: 1.08 }
      : body
  );

  const renderedPlanets = planets.map((planet) =>
    (planet.id ?? "orphans") === draggingProjectId
      ? { ...planet, x: drag!.x, y: drag!.y, depth: 1 }
      : planet
  );

  const targetRing =
    drag?.active && drag.kind === "task" && drag.dockId === undefined
      ? (() => {
          const flatY = drag.y / TILT;
          const radius = Math.sqrt(drag.x * drag.x + flatY * flatY);
          const ring = nearestRing(drag.x, drag.y);

          return Math.abs(radius - ring.radius) <= SNAP_DISTANCE ? ring : null;
        })()
      : null;

  const emberSources: EmberSource[] =
    focus.kind === "system"
      ? renderedPlanets
          .filter((planet) => planet.active > 0)
          .map((planet) => ({ x: planet.x, y: planet.y, color: planet.color }))
      : renderedBodies
          .filter((body) => body.task.status === "in_progress")
          .map((body) => ({ x: body.x, y: body.y, color: "#ff9e2c" }));

  const anchorBody = selectedTaskId
    ? bodies.find((body) => body.task.id === selectedTaskId)
    : undefined;
  const anchor = anchorBody ? { x: anchorBody.x, y: anchorBody.y } : null;

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
        <SceneBackdrop rotation={rotation} />
        <EmberField ref={emberRef} sources={emberSources} />

        <AnimatePresence initial={false}>
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

                {renderedPlanets.map((planet) => (
                  <ProjectBody
                    key={planet.id ?? "orphans"}
                    planet={planet}
                    isSpinning={isSpinning}
                    isDragging={(planet.id ?? "orphans") === draggingProjectId}
                    onFocus={(id) => {
                      if (!suppressClick.current) onFocusChange({ kind: "project", id });
                    }}
                    onDragStart={(id, event) => beginDrag("project", id, event)}
                    onResetPosition={(id) => resetPosition("projects", id)}
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
                    isDragging={body.task.id === draggingTaskId}
                    onSelect={(id) => {
                      if (!suppressClick.current) onSelectTask(id);
                    }}
                    onDragStart={(id, event) => beginDrag("task", id, event)}
                    onResetPosition={(id) => resetPosition("tasks", id)}
                  />
                ))}
              </div>

              <TaskPopover
                taskId={selectedTaskId}
                anchor={anchor}
                sceneWidth={sceneSize.width}
                sceneHeight={sceneSize.height}
                onClose={() => onSelectTask("")}
              />

              <ProjectDock
                targets={dockTargets}
                isDragging={drag?.active === true && drag.kind === "task"}
                activeId={drag?.dockId}
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