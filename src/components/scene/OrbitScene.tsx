"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { TILT, layoutBodies, rings } from "@/lib/orbits";
import type { Task } from "@/types/api";
import { TaskBody } from "./TaskBody";

interface OrbitSceneProps {
  tasks: Task[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function OrbitScene({ tasks, selectedId, onSelect }: OrbitSceneProps) {
  const reduce = useReducedMotion();

  const [rotation, setRotation] = useState(-Math.PI / 2);
  const dragState = useRef<{ pointerId: number; lastX: number; velocity: number } | null>(null);
  const inertia = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (inertia.current !== null) cancelAnimationFrame(inertia.current);
    };
  }, []);

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (inertia.current !== null) cancelAnimationFrame(inertia.current);

    event.currentTarget.setPointerCapture(event.pointerId);
    dragState.current = { pointerId: event.pointerId, lastX: event.clientX, velocity: 0 };
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragState.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const delta = (event.clientX - drag.lastX) * 0.006;
    drag.lastX = event.clientX;
    drag.velocity = delta;

    setRotation((current) => current + delta);
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragState.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    let velocity = drag.velocity;
    dragState.current = null;

    if (reduce || Math.abs(velocity) < 0.0015) return;

    function step() {
      velocity *= 0.94;
      setRotation((current) => current + velocity);

      if (Math.abs(velocity) > 0.0004) {
        inertia.current = requestAnimationFrame(step);
      }
    }

    inertia.current = requestAnimationFrame(step);
  }

  const bodies = layoutBodies(tasks, rotation);

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="relative h-[560px] w-full cursor-grab touch-none select-none active:cursor-grabbing"
    >
      <div className="absolute left-1/2 top-1/2">
        {rings.map(({ status, radius, label }) => (
          <div
            key={status}
            aria-hidden
            className="absolute rounded-[50%] border border-line"
            style={{
              width: radius * 2,
              height: radius * 2 * TILT,
              transform: "translate(-50%, -50%)",
              borderColor:
                status === "in_progress"
                  ? "color-mix(in oklab, var(--accent) 22%, transparent)"
                  : "var(--line)",
            }}
            title={label}
          />
        ))}

        <div
          aria-hidden
          className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent"
          style={{ boxShadow: "var(--glow)" }}
        />

        {bodies.map((body) => (
          <TaskBody
            key={body.task.id}
            body={body}
            isSelected={body.task.id === selectedId}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}