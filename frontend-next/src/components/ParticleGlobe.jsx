'use client';

/**
 * Interactive particle globe for the login screen.
 * Transparent canvas so the fluid layer underneath keeps its original colors.
 */
import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const COUNT = 600;
const RADIUS = 1.7;
const SPIN_Y = 0.32;
const SPIN_X = 0.28;
const BREATH_SPEED = 2.2;

function GlobePoints({ mouse }) {
  const pointsRef = useRef(null);
  const { viewport } = useThree();

  const { positions, base } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const base = new Float32Array(COUNT * 3);

    for (let i = 0; i < COUNT; i += 1) {
      const t = i / COUNT;
      const inclination = Math.acos(1 - 2 * t);
      const azimuth = Math.PI * (1 + Math.sqrt(5)) * i;
      const r = RADIUS * (0.985 + Math.random() * 0.03);
      const x = r * Math.sin(inclination) * Math.cos(azimuth);
      const y = r * Math.sin(inclination) * Math.sin(azimuth);
      const z = r * Math.cos(inclination);
      base[i * 3] = x;
      base[i * 3 + 1] = y;
      base[i * 3 + 2] = z;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }

    return { positions, base };
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [positions]);

  useFrame((state) => {
    const points = pointsRef.current;
    if (!points) return;

    const gl = state.gl.getContext();
    if (!gl || gl.isContextLost?.()) return;

    const pos = points.geometry.attributes.position.array;
    const t = state.clock.elapsedTime;

    points.rotation.y = t * SPIN_Y;
    points.rotation.x = Math.sin(t * SPIN_X) * 0.1;

    const mx = (mouse.current.x * viewport.width) / 2;
    const my = (mouse.current.y * viewport.height) / 2;
    const influence = 0.55;
    const falloff = 1.35;

    for (let i = 0; i < COUNT; i += 1) {
      const ix = i * 3;
      const bx = base[ix];
      const by = base[ix + 1];
      const bz = base[ix + 2];

      const cosY = Math.cos(points.rotation.y);
      const sinY = Math.sin(points.rotation.y);
      const rx = bx * cosY - bz * sinY;
      const rz = bx * sinY + bz * cosY;
      const ry = by;

      const dx = rx - mx;
      const dy = ry - my;
      const dist = Math.sqrt(dx * dx + dy * dy + rz * rz * 0.35) + 0.001;
      const force = Math.exp(-dist * falloff) * influence;

      const breath = 1 + Math.sin(t * BREATH_SPEED + i * 0.01) * 0.01;
      pos[ix] = bx * breath + (dx / dist) * force;
      pos[ix + 1] = by * breath + (dy / dist) * force;
      pos[ix + 2] = bz * breath + force * 0.35;
    }

    points.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        color="#E0E1E4"
        size={0.03}
        sizeAttenuation
        transparent
        opacity={1}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default function ParticleGlobe() {
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[1]"
      aria-hidden="true"
      style={{
        // Soft circular clear zone aligned to the headline barrier
        WebkitMaskImage:
          'radial-gradient(circle 9.5vmin at 50% 42%, transparent 0%, transparent 68%, #000 70%)',
        maskImage:
          'radial-gradient(circle 9.5vmin at 50% 42%, transparent 0%, transparent 68%, #000 70%)',
      }}
    >
      <Canvas
        gl={{
          antialias: false,
          alpha: true,
          premultipliedAlpha: false,
          powerPreference: 'high-performance',
          failIfMajorPerformanceCaveat: false,
        }}
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 6.8], fov: 40 }}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          background: 'transparent',
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
      >
        <GlobePoints mouse={mouse} />
      </Canvas>
    </div>
  );
}
