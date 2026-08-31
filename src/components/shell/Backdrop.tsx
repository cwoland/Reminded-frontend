"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";

export function Backdrop({ mood = "ambient" }: { mood?: "ambient" | "alive" }) {
  const reduce = useReducedMotion();

  const pointerX = useMotionValue(0.5);
  const pointerY = useMotionValue(0.5);

  const springX = useSpring(pointerX, { stiffness: 40, damping: 20, mass: 0.6 });
  const springY = useSpring(pointerY, { stiffness: 40, damping: 20, mass: 0.6 });

  const gridShift = useTransform(
    [springX, springY],
    ([x, y]: number[]) => `translate3d(${(x - 0.5) * -24}px, ${(y - 0.5) * -16}px, 0)`
  );

  const glowShift = useTransform(
    [springX, springY],
    ([x, y]: number[]) => `translate3d(${(x - 0.5) * 60}px, ${(y - 0.5) * 30}px, 0)`
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
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        style={{ transform: gridShift }}
        className="absolute -inset-16 opacity-[0.14]"
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--line) 1px, transparent 1px), linear-gradient(to bottom, var(--line) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black, transparent 100%)",
          }}
        />
      </motion.div>

      <motion.div
        style={{ transform: glowShift }}
        className={`absolute inset-x-0 top-0 h-[60vh] ${
          mood === "alive" && !reduce ? "animate-[breathe_14s_ease-in-out_infinite]" : ""
        }`}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 0%, color-mix(in oklab, var(--accent) 12%, transparent), transparent 70%)",
          }}
        />
      </motion.div>

      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, var(--bg) 100%)",
        }}
      />
    </div>
  );
}