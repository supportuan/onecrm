'use client';

export default function LoginVideoBackground({ src }) {
  if (!src) return null;
  return (
    <video
      className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      src={src}
      aria-hidden="true"
    />
  );
}
