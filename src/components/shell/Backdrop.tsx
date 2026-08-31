"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";

export function Backdrop({ mood = "ambient" }: { mood?: "ambient" | "alive" }) {
  const reduce = useReducedMotion();

  const pointerX = useMotionValue(0.5);
  const pointerY = useMotionValue(0.5);

  const springX = useSpring(pointerX, { stiffness: 40, damping: 20, mass: 0.6 });
  const springY = useSpring(pointerY, { stiffness: 40, damping: 20, mass: 0.6 });

  const sphereShift = useTransform(
    [springX, springY],
    ([x, y]: number[]) => `translate3d(${(x - 0.5) * -30}px, ${(y - 0.5) * -18}px, 0)`
  );

  const gridShift = useTransform(
    [springX, springY],
    ([x, y]: number[]) => `translate3d(${(x - 0.5) * -14}px, ${(y - 0.5) * -8}px, 0)`
  );

  useEffect(() => {
    if (reduce) return;

    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!media.matches) return;

    function handleMove(event: PointerEvent) {
      pointerX.set(event.clientX / window.innerWidth);
      pointerY.set(event.clientY / window.innerHeight);
    }

    window.addEventListener("pointermove", handleMove, { passive: true });
    return () => window.removeEventListener("pointermove", handleMove);
  }, [pointerX, pointerY, reduce]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-bg">
      {/* Сетка */}
      <motion.div style={{ transform: gridShift }} className="absolute -inset-16 opacity-[0.1]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--accent) 1px, transparent 1px), linear-gradient(to bottom, var(--accent) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
            maskImage: "radial-gradient(ellipse 75% 65% at 50% 45%, black, transparent 100%)",
          }}
        />
      </motion.div>

      {/* Сфера */}
      <motion.div
        style={{ transform: sphereShift }}
        className={`absolute left-1/2 top-1/2 h-[min(150vh,150vw)] w-[min(150vh,150vw)] -translate-x-1/2 -translate-y-1/2 ${
          mood === "alive" && !reduce ? "animate-[breathe_16s_ease-in-out_infinite]" : ""
        }`}
      >
        <svg viewBox="0 0 1000 1000" className="h-full w-full opacity-[0.55]">
          <defs>
            <radialGradient id="core" cx="50%" cy="50%">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.32" />
              <stop offset="45%" stopColor="var(--accent)" stopOpacity="0.06" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="limb" cx="50%" cy="50%">
              <stop offset="82%" stopColor="var(--accent)" stopOpacity="0" />
              <stop offset="97%" stopColor="var(--accent)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </radialGradient>
          </defs>

          <circle cx="500" cy="500" r="470" fill="url(#core)" />
          <circle cx="500" cy="500" r="470" fill="url(#limb)" />

          {[210, 300, 390, 470].map((r, index) => (
            <circle
              key={r}
              cx="500"
              cy="500"
              r={r}
              fill="none"
              stroke="var(--accent)"
              strokeOpacity={0.16 - index * 0.02}
              strokeWidth="1"
              strokeDasharray={index % 2 === 0 ? "none" : "3 9"}
            />
          ))}

          {Array.from({ length: 48 }).map((_, index) => {
            const angle = (index / 48) * Math.PI * 2;
            const long = index % 6 === 0;
            const inner = long ? 442 : 456;

            return (
              <line
                key={index}
                x1={500 + Math.cos(angle) * inner}
                y1={500 + Math.sin(angle) * inner}
                x2={500 + Math.cos(angle) * 470}
                y2={500 + Math.sin(angle) * 470}
                stroke="var(--accent)"
                strokeOpacity={long ? 0.34 : 0.16}
                strokeWidth="1"
              />
            );
          })}

          {Array.from({ length: 12 }).map((_, index) => {
            const angle = (index / 12) * Math.PI * 2;

            return (
              <line
                key={`ray-${index}`}
                x1={500 + Math.cos(angle) * 120}
                y1={500 + Math.sin(angle) * 120}
                x2={500 + Math.cos(angle) * 470}
                y2={500 + Math.sin(angle) * 470}
                stroke="var(--accent)"
                strokeOpacity="0.06"
                strokeWidth="1"
              />
            );
          })}
        </svg>
      </motion.div>

      {/* Виньетка */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 95% 95% at 50% 50%, transparent 35%, var(--bg) 100%)",
        }}
      />
    </div>
  );
}