import Image from "next/image";

export function ImageBackdrop({ src, size = 820 }: { src: string; size?: number }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-[9] overflow-hidden">
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: size,
          height: size,
          maskImage: "radial-gradient(circle, black 42%, transparent 74%)",
        }}
      >
        <Image
          src={src}
          alt=""
          fill
          sizes={`${size}px`}
          className="object-cover opacity-40 mix-blend-screen"
        />
      </div>

      <div className="absolute inset-0 bg-bg/45" />
    </div>
  );
}