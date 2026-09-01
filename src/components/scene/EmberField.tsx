"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { useReducedMotion } from "motion/react";

export interface EmberSource {
  x: number;
  y: number;
  color: string;
}

export interface EmberFieldHandle {
  burst: (x: number, y: number, color: string) => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

const MAX_PARTICLES = 140;
const SPAWN_CHANCE = 0.02;

interface EmberFieldProps {
  sources: EmberSource[];
}

export const EmberField = forwardRef<EmberFieldHandle, EmberFieldProps>(function EmberField(
  { sources },
  ref
) {
  const reduce = useReducedMotion();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const sourcesRef = useRef<EmberSource[]>(sources);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    sourcesRef.current = sources;
  }, [sources]);

  useImperativeHandle(
    ref,
    () => ({
      burst(x: number, y: number, color: string) {
        if (reduce) return;

        for (let i = 0; i < 26; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 0.6 + Math.random() * 1.9;

          particlesRef.current.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 0.5,
            life: 0,
            maxLife: 70 + Math.random() * 60,
            size: 1 + Math.random() * 2.2,
            color,
          });
        }
      },
    }),
    [reduce]
  );

  useEffect(() => {
    if (reduce) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    let width = 0;
    let height = 0;

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);

      width = rect.width;
      height = rect.height;

      canvas!.width = Math.round(width * ratio);
      canvas!.height = Math.round(height * ratio);
      context!.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    resize();

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    function spawnFromSources() {
      for (const source of sourcesRef.current) {
        if (Math.random() > SPAWN_CHANCE) continue;
        if (particlesRef.current.length >= MAX_PARTICLES) return;

        const drift = (Math.random() - 0.5) * 0.5;

        particlesRef.current.push({
          x: source.x + (Math.random() - 0.5) * 14,
          y: source.y + (Math.random() - 0.5) * 8,
          vx: drift,
          vy: -0.25 - Math.random() * 0.45,
          life: 0,
          maxLife: 110 + Math.random() * 90,
          size: 0.8 + Math.random() * 1.4,
          color: source.color,
        });
      }
    }

    function step() {
      context!.clearRect(0, 0, width, height);
      context!.globalCompositeOperation = "lighter";

      spawnFromSources();

      const centerX = width / 2;
      const centerY = height / 2;
      const next: Particle[] = [];

      for (const particle of particlesRef.current) {
        particle.life += 1;
        if (particle.life > particle.maxLife) continue;

        particle.x += particle.vx;
        particle.y += particle.vy;

        particle.vy -= 0.004;
        particle.vx += (Math.random() - 0.5) * 0.03;
        particle.vx *= 0.99;

        const progress = particle.life / particle.maxLife;
        const alpha = Math.sin((1 - progress) * Math.PI * 0.5) * (0.7 + Math.random() * 0.3);
        const radius = particle.size * (1 - progress * 0.6);

        context!.globalAlpha = Math.max(0, alpha);
        context!.fillStyle = particle.color;
        context!.beginPath();
        context!.arc(centerX + particle.x, centerY + particle.y, radius, 0, Math.PI * 2);
        context!.fill();

        next.push(particle);
      }

      particlesRef.current = next;
      context!.globalAlpha = 1;

      frameRef.current = requestAnimationFrame(step);
    }

    function start() {
      if (frameRef.current === null) frameRef.current = requestAnimationFrame(step);
    }

    function pause() {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    }

    function handleVisibility() {
      if (document.hidden) pause();
      else start();
    }

    document.addEventListener("visibilitychange", handleVisibility);
    start();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      observer.disconnect();
      pause();
      particlesRef.current = [];
    };
  }, [reduce]);

  if (reduce) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
});