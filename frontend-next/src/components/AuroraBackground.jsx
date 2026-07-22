'use client';

/**
 * Soft northern-lights background for the Aurora login theme (mobile).
 * Vertical color curtains over a lavender base — distinct from Mist's liquid mesh.
 */
import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { LOGIN_BG_THEMES } from '@/lib/loginBgThemes';

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec3 uBase;
  uniform vec3 uBlue;
  uniform vec3 uViolet;
  uniform vec3 uMagenta;
  uniform vec3 uHighlight;
  uniform float uSpeed;
  uniform float uGrain;

  varying vec2 vUv;

  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453);
  }

  float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  float fbm(vec2 st) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 5; i++) {
      value += amplitude * noise(st);
      st *= 2.1;
      amplitude *= 0.5;
    }
    return value;
  }

  // Soft vertical curtain: warped by noise so bands feel alive
  float curtain(vec2 uv, float phase, float width, float t) {
    float warp = fbm(vec2(uv.x * 1.8 + phase, uv.y * 0.55 + t * 0.15));
    float x = uv.x + (warp - 0.5) * 0.28;
    float band = 1.0 - smoothstep(0.0, width, abs(x - phase));
    // Fade toward bottom so light pools near the top / mid
    float height = smoothstep(0.0, 0.35, uv.y) * (1.0 - smoothstep(0.55, 1.05, uv.y));
    float shimmer = 0.65 + 0.35 * sin(uv.y * 9.0 + t * 1.4 + warp * 6.0);
    return band * height * shimmer;
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 p = uv;
    p.x *= aspect;

    float t = uTime * uSpeed;

    // Slow horizontal drift of the whole field
    vec2 drift = vec2(t * 0.04, t * 0.02);
    vec2 cuv = uv + vec2(fbm(p * 1.2 + drift) * 0.06, 0.0);

    float c1 = curtain(cuv, 0.22 + 0.04 * sin(t * 0.35), 0.42, t);
    float c2 = curtain(cuv, 0.48 + 0.05 * cos(t * 0.28), 0.38, t * 1.05);
    float c3 = curtain(cuv, 0.72 + 0.04 * sin(t * 0.42 + 1.2), 0.40, t * 0.9);

    // Soft sky wash
    float sky = fbm(p * 2.4 + drift * 0.5);
    vec3 color = mix(uBase, uHighlight, sky * 0.55);

    // Layer aurora ribbons
    color = mix(color, uBlue, c1 * 0.72);
    color = mix(color, uViolet, c2 * 0.78);
    color = mix(color, uMagenta, c3 * 0.68);

    // Gentle bloom highlight where curtains overlap
    float glow = c1 * c2 + c2 * c3 * 0.7;
    color += uHighlight * glow * 0.35;
    color += uBlue * c1 * 0.08;
    color += uMagenta * c3 * 0.06;

    // Soft radial lift so form fields stay readable
    float vignetteLift = 1.0 - length((uv - vec2(0.5, 0.42)) * vec2(1.1, 1.25)) * 0.35;
    color *= mix(0.92, 1.05, clamp(vignetteLift, 0.0, 1.0));

    float grain = (random(gl_FragCoord.xy + t) - 0.5) * uGrain;
    color += grain;

    gl_FragColor = vec4(color, 1.0);
  }
`;

function ShaderPlane({ base, highlight, blue, violet, magenta, speed = 0.22, grain = 0.03 }) {
  const materialRef = useRef(null);
  const { size, viewport } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uBase: { value: new THREE.Color(base) },
      uHighlight: { value: new THREE.Color(highlight) },
      uBlue: { value: new THREE.Color(blue) },
      uViolet: { value: new THREE.Color(violet) },
      uMagenta: { value: new THREE.Color(magenta) },
      uSpeed: { value: speed },
      uGrain: { value: grain },
    }),
    [base, highlight, blue, violet, magenta, speed, grain]
  );

  useFrame((state) => {
    const mat = materialRef.current;
    if (!mat) return;
    mat.uniforms.uTime.value = state.clock.elapsedTime;
    mat.uniforms.uResolution.value.set(size.width * state.viewport.dpr, size.height * state.viewport.dpr);
  });

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        key={`${base}-${blue}-${violet}-${magenta}`}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}

export default function AuroraBackground({ className = '' }) {
  const theme = LOGIN_BG_THEMES.find((t) => t.id === 'aurora') || LOGIN_BG_THEMES[0];

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-0 ${className}`}
      aria-hidden="true"
      style={{ background: theme.base }}
    >
      <Canvas
        gl={{
          antialias: false,
          alpha: false,
          powerPreference: 'high-performance',
          stencil: false,
          depth: false,
        }}
        dpr={[1, 1.25]}
        camera={{ position: [0, 0, 1], fov: 50 }}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        frameloop="always"
      >
        <ShaderPlane
          base={theme.base}
          highlight={theme.highlight}
          blue="#5b8cff"
          violet="#8b6cf0"
          magenta="#e879f9"
          speed={0.2}
          grain={0.028}
        />
        <EffectComposer multisampling={0}>
          <Bloom intensity={0.55} luminanceThreshold={0.28} luminanceSmoothing={0.5} mipmapBlur />
          <Noise
            premultiply
            blendFunction={BlendFunction.SOFT_LIGHT}
            opacity={0.18}
          />
          <Vignette eskil={false} offset={0.2} darkness={0.24} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
