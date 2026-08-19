'use client';

/**
 * Richard Sancho-style background: four Lambert hemispheres, CSS blur, film-grain vector overlay.
 * Used inside authenticated app shells only — not on login/public routes.
 */
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';

const BLOBS = [
  {
    color: '#5949ea',
    position: [-40, 20, 0],
    rotation: [0, 0, -Math.PI / 4],
    spin: { y: -0.5, z: 0.3 },
  },
  {
    color: '#000000',
    position: [-30, -30, 0],
    rotation: [0, 0, 0],
    spin: { z: 0.5 },
  },
  {
    color: '#ffc960',
    position: [40, 0, -20],
    rotation: [0, 0, Math.PI / 4],
    spin: { y: 0.3, z: -0.4 },
  },
  {
    color: '#fe5d5d',
    position: [0, 0, -10],
    rotation: [(-60 * Math.PI) / 180, 0, 0],
    spin: { y: 0.5, z: -0.2 },
  },
];

const reducedMotionSubscribe = (onStoreChange) => {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  media.addEventListener('change', onStoreChange);
  return () => media.removeEventListener('change', onStoreChange);
};

const getReducedMotionSnapshot = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function HemisphereBlob({ color, position, rotation, spin, reducedMotion }) {
  const meshRef = useRef(null);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh || reducedMotion) return;
    if (spin.x) mesh.rotation.x += spin.x * delta;
    if (spin.y) mesh.rotation.y += spin.y * delta;
    if (spin.z) mesh.rotation.z += spin.z * delta;
  });

  return (
    <mesh ref={meshRef} position={position} rotation={rotation} scale={50}>
      <sphereGeometry args={[1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshLambertMaterial color={color} />
    </mesh>
  );
}

function BlobScene({ mouse, reducedMotion }) {
  const { camera, invalidate } = useThree();

  useEffect(() => {
    if (reducedMotion) {
      invalidate();
      return undefined;
    }

    let timer = 0;
    const tick = () => {
      if (!document.hidden) invalidate();
      timer = window.setTimeout(tick, 1000 / 45);
    };
    tick();
    return () => window.clearTimeout(timer);
  }, [invalidate, reducedMotion]);

  useFrame(() => {
    if (reducedMotion) return;
    camera.position.x += (mouse.current.x - camera.position.x) / 20;
    camera.position.y += (mouse.current.y - camera.position.y) / 20;
    camera.lookAt(0, 0, 0);
  });

  return (
    <>
      <directionalLight color="#ffffff" intensity={1} position={[40, 200, 200]} />
      {BLOBS.map((blob) => (
        <HemisphereBlob key={blob.color + blob.position.join(',')} {...blob} reducedMotion={reducedMotion} />
      ))}
    </>
  );
}

export default function SoftBlobBackground({ offsetLeft = 0 }) {
  const mouse = useRef({ x: 0, y: 0 });
  const reducedMotion = useSyncExternalStore(
    reducedMotionSubscribe,
    getReducedMotionSnapshot,
    () => false
  );

  useEffect(() => {
    const onMove = (event) => {
      mouse.current.x = (event.clientX - window.innerWidth / 2) / 10;
      mouse.current.y = (event.clientY - window.innerHeight / 2) / 10;
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <div
      className="app-soft-blobs"
      aria-hidden="true"
      style={{ left: offsetLeft }}
    >
      <Canvas
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'low-power',
          stencil: false,
        }}
        dpr={1}
        frameloop="demand"
        camera={{ fov: 45, position: [0, 0, 150], near: 1, far: 10000 }}
        onCreated={({ camera }) => camera.lookAt(0, 0, 0)}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      >
        <BlobScene mouse={mouse} reducedMotion={reducedMotion} />
      </Canvas>
      <div className="app-soft-blobs-noise" />
    </div>
  );
}
