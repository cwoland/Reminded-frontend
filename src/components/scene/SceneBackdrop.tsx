"use client";

import Image from "next/image";

export function SceneBackdrop({ rotation }: { rotation: number }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute left-1/2 top-1/2 h-[860px] w-[860px]"
        style={{
          transform: `translate(-50%, -50%) rotate(${rotation * 0.12}rad)`,
          maskImage: "radial-gradient(circle at 50% 50%, black 55%, transparent 78%)",
        }}
      >
        <Image
          src="/Jarvis.jpg"
          alt=""
          fill
          priority
          sizes="860px"
          className="select-none object-cover opacity-45 mix-blend-screen"
        />
      </div>

      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, color-mix(in oklab, var(--bg) 62%, transparent) 0%, color-mix(in oklab, var(--bg) 30%, transparent) 48%, transparent 72%)",
        }}
      />

      <div
        className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklab, var(--accent) 18%, transparent), transparent 70%)",
        }}
      />
    </div>
  );
}