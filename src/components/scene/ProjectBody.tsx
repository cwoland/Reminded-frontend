"use client";

import { useMemo } from "react";
import type { ProjectPlanet } from "@/lib/orbits";

const LATITUDES = [-52, -18, 18, 52];
const MERIDIANS = 8;
const R = 44;

interface Node {
  x: number;
  y: number;
  z: number;
}

interface Edge {
  a: Node;
  b: Node;
  z: number;
}

/** Проволочная сфера: узлы на сетке широта/долгота, рёбра — прямые хорды между ними. */
function buildSphere(seed: number): { edges: Edge[]; nodes: Node[] } {
  const grid: Node[][] = LATITUDES.map((lat) => {
    const phi = (lat * Math.PI) / 180;

    return Array.from({ length: MERIDIANS }, (_, index) => {
      const lambda = ((index / MERIDIANS) * 360 + seed) * (Math.PI / 180);

      return {
        x: 50 + R * Math.cos(phi) * Math.cos(lambda),
        y: 50 - R * Math.sin(phi),
        z: Math.cos(phi) * Math.sin(lambda),
      };
    });
  });

  const north: Node = { x: 50, y: 50 - R, z: 0 };
  const south: Node = { x: 50, y: 50 + R, z: 0 };

  const edges: Edge[] = [];

  grid.forEach((ring) => {
    ring.forEach((node, index) => {
      const next = ring[(index + 1) % MERIDIANS];
      edges.push({ a: node, b: next, z: (node.z + next.z) / 2 });
    });
  });

  for (let lat = 0; lat < grid.length - 1; lat++) {
    grid[lat].forEach((node, index) => {
      const below = grid[lat + 1][index];
      edges.push({ a: node, b: below, z: (node.z + below.z) / 2 });
    });
  }

  grid[grid.length - 1].forEach((node) => {
    edges.push({ a: node, b: north, z: node.z });
  });
  grid[0].forEach((node) => {
    edges.push({ a: node, b: south, z: node.z });
  });

  return { edges, nodes: grid.flat() };
}

function seedFrom(id: string | null): number {
  if (id === null) return 22;

  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);

  return sum % 45;
}

interface ProjectBodyProps {
  planet: ProjectPlanet;
  isSpinning: boolean;
  isDragging: boolean;
  onFocus: (id: string | null) => void;
  onDragStart: (id: string | null, event: React.PointerEvent<HTMLButtonElement>) => void;
  onResetPosition: (id: string | null) => void;
}

export function ProjectBody({
  planet,
  isSpinning,
  isDragging,
  onFocus,
  onDragStart,
  onResetPosition,
}: ProjectBodyProps) {
  const { id, title, color, total, active, x, y, depth, scale, size, pinned = false } = planet;

  const { edges, nodes } = useMemo(() => buildSphere(seedFrom(id)), [id]);
  const box = size * 1.9;
  const gradientId = `planet-${id ?? "orphans"}`;

  const frozen = isSpinning || isDragging;

  return (
    <button
      type="button"
      onPointerDown={(event) => onDragStart(id, event)}
      onClick={() => onFocus(id)}
      onDoubleClick={() => onResetPosition(id)}
      title={pinned ? "Расположено вручную · двойной клик вернёт на орбиту" : title}
      style={{
        transform: `translate3d(calc(${x}px - 50%), calc(${y}px - 50%), 0) scale(${
          isDragging ? scale * 1.06 : scale
        })`,
        zIndex: isDragging ? 500 : Math.round((depth + 1) * 100),
        opacity: isDragging ? 1 : 0.72 + (depth + 1) * 0.14,
        transitionProperty: frozen ? "opacity" : "opacity, transform",
        transitionDuration: frozen ? "var(--dur-hint)" : "var(--dur-scene)",
        transitionTimingFunction: "var(--ease-in-out-strong)",
        cursor: isDragging ? "grabbing" : "grab",
      }}
      className="group absolute left-1/2 top-1/2 flex touch-none flex-col items-center gap-1.5"
    >
      <svg
        width={box}
        height={box}
        viewBox="0 0 100 100"
        className="overflow-visible transition-[filter] duration-[var(--dur-menu)] ease-[var(--ease-out-strong)]"
        style={{
          filter:
            isDragging || active > 0
              ? `drop-shadow(0 0 ${isDragging ? 16 : 10}px color-mix(in oklab, ${color} 65%, transparent))`
              : undefined,
        }}
      >
        <defs>
          <radialGradient id={gradientId} cx="34%" cy="30%" r="72%">
            <stop offset="0%" stopColor={color} stopOpacity="0.42" />
            <stop offset="55%" stopColor={color} stopOpacity="0.12" />
            <stop offset="100%" stopColor="var(--bg)" stopOpacity="0.9" />
          </radialGradient>
        </defs>

        <circle cx="50" cy="50" r={R} fill="var(--bg)" fillOpacity="0.82" />
        <circle cx="50" cy="50" r={R} fill={`url(#${gradientId})`} />

        {edges.map((edge, index) => (
          <line
            key={index}
            x1={edge.a.x}
            y1={edge.a.y}
            x2={edge.b.x}
            y2={edge.b.y}
            stroke={color}
            strokeWidth={edge.z > 0 ? 1.4 : 0.8}
            strokeOpacity={edge.z > 0 ? 0.85 : 0.28}
            strokeLinecap="round"
          />
        ))}

        {nodes
          .filter((node) => node.z > 0)
          .map((node, index) => (
            <circle key={index} cx={node.x} cy={node.y} r="1.6" fill={color} fillOpacity="0.9" />
          ))}

        <circle
          cx="50"
          cy="50"
          r={R}
          fill="none"
          stroke={color}
          strokeWidth="1.8"
          strokeOpacity="0.55"
        />

        {pinned && (
          <circle
            cx="50"
            cy="50"
            r={R + 5}
            fill="none"
            stroke={color}
            strokeWidth="1"
            strokeOpacity="0.5"
            strokeDasharray="3 5"
          />
        )}

        {active > 0 && <circle cx="50" cy="50" r="5.5" fill={color} />}
      </svg>

      <span className="flex flex-col items-center gap-0.5 rounded-[var(--radius-sm)] bg-bg/55 px-2 py-1 backdrop-blur-[6px]">
        <span className="max-w-[150px] truncate text-[13px] leading-none text-muted transition-colors duration-[var(--dur-hint)] group-hover:text-text">
          {title}
        </span>
        <span className="meta">
          {total}
          {active > 0 ? ` · ${active} в работе` : ""}
        </span>
      </span>
    </button>
  );
}