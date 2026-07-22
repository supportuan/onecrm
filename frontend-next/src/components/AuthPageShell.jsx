'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useAppearanceStore } from '@/lib/stores/appearanceStore';

const LuminaFluidBackground = dynamic(() => import('./LuminaFluidBackground'), {
  ssr: false,
});

export default function AuthPageShell({ children, wide = false }) {
  const { loginTheme: theme } = useAppearanceStore();
  const [enableFluid, setEnableFluid] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
      setEnableFluid(!reduceMotion && !coarsePointer);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-4 py-12 text-white sm:px-6">
      {enableFluid ? (
        <LuminaFluidBackground fluidColor={theme.fluidColor} rainbow />
      ) : (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              theme.fallbackGradient ||
              'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0,94,255,0.18), transparent 55%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(120,220,210,0.1), transparent 50%)',
          }}
        />
      )}

      <div
        className={`relative z-10 mx-auto w-full ${
          wide ? 'max-w-5xl' : 'max-w-[480px]'
        }`}
      >
        {children}
      </div>
    </main>
  );
}
