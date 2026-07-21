'use client';

/**
 * Same mouse-fluid effect used on https://www.lumina-design.co/
 * (@whatisjery/react-fluid-distortion with rainbow mode).
 */
import { Canvas } from '@react-three/fiber';
import { EffectComposer } from '@react-three/postprocessing';
import { Fluid } from '@whatisjery/react-fluid-distortion';

export default function LuminaFluidBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
      <Canvas
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          background: '#000000',
        }}
        eventSource={typeof document !== 'undefined' ? document.documentElement : undefined}
        eventPrefix="client"
      >
        <EffectComposer>
          {/* Matches Lumina homepage Fluid props */}
          <Fluid
            showBackground={false}
            fluidColor="#0b2a5b"
            rainbow
            blend={1}
            intensity={1.8}
            force={1.4}
            radius={0.4}
            curl={1.9}
            swirl={4}
            pressure={0.8}
            densityDissipation={0.98}
            velocityDissipation={1}
            distortion={0.55}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
