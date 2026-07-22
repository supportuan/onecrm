'use client';

/**
 * Mouse-fluid cursor effect (@whatisjery/react-fluid-distortion).
 * Rainbow mode matches the Aurora login trail across all appearance themes.
 */
import { Canvas } from '@react-three/fiber';
import { EffectComposer } from '@react-three/postprocessing';
import { Fluid } from '@whatisjery/react-fluid-distortion';

export default function LuminaFluidBackground({
  fluidColor = '#4c1d95',
  rainbow = true,
}) {
  return (
    <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
      <Canvas
        key={`${fluidColor}-${rainbow}`}
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
          <Fluid
            showBackground={false}
            fluidColor={fluidColor}
            rainbow={rainbow}
            blend={1}
            intensity={1.6}
            force={1.3}
            radius={0.4}
            curl={1.7}
            swirl={3.5}
            pressure={0.8}
            densityDissipation={0.98}
            velocityDissipation={1}
            distortion={0.5}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
