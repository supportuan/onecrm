'use client';

import Image from 'next/image';

/**
 * Shared auth shell with ApplyUniNow logo backdrop (same asset as in-app watermark).
 */
export default function AuthPageShell({ children, wide = false }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f3f5f9] px-4 py-10 sm:px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center"
      >
        <Image
          src="/images/applyUniNow-mark.png"
          alt=""
          width={720}
          height={720}
          priority
          unoptimized
          className="h-[min(88vmin,720px)] w-[min(88vmin,720px)] select-none object-contain"
          style={{ opacity: 0.08, mixBlendMode: 'multiply' }}
        />
      </div>

      <div className={`relative z-10 w-full ${wide ? 'max-w-6xl' : 'max-w-md'}`}>
        {children}
      </div>
    </main>
  );
}
