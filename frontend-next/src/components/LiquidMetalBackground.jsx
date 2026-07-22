'use client';

/**
 * Soft liquid / mesh-gradient background (animated).
 * Supports light pastel themes + dark liquid-metal.
 */
import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette, ChromaticAberration, Noise } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { LOGIN_BG_THEMES } from '@/lib/loginBgThemes';

export { LOGIN_BG_THEMES };
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
  uniform vec3 uHighlight;
  uniform vec3 uSecondary;
  uniform float uNoiseScale;
  uniform float uSpeed;
  uniform float uDistortion;
  uniform float uGloss;
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
      st *= 2.05;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 p = uv;
    p.x *= aspect;

    float t = uTime * uSpeed;
    float n = fbm(p * uNoiseScale + t * 0.35);
    float n2 = fbm(p * (uNoiseScale * 1.6) - t * 0.22);

    vec2 distorted = uv;
    distorted.x += uDistortion * sin(uv.y * 8.0 + t + n * 6.2831);
    distorted.y += uDistortion * cos(uv.x * 8.0 + t + n2 * 6.2831);

    float flow = fbm(distorted * uNoiseScale + vec2(t * 0.2, -t * 0.15));
    float flow2 = fbm(distorted * (uNoiseScale * 0.7) - vec2(t * 0.12, t * 0.18));
    float ridges = pow(1.0 - abs(flow * 2.0 - 1.0), 2.2);
    float sheen = pow(max(ridges, 0.0), mix(1.2, 0.45, uGloss));

    float fresnel = pow(1.0 - length(uv - 0.5) * 1.25, 2.0);
    fresnel = clamp(fresnel, 0.0, 1.0);

    // Soft mesh blend across three theme colors
    vec3 color = mix(uBase, uSecondary, smoothstep(0.15, 0.9, flow));
    color = mix(color, uHighlight, smoothstep(0.35, 0.95, flow2) * 0.75);
    color = mix(color, uHighlight, sheen * 0.55 * uGloss);
    color += uHighlight * fresnel * 0.12 * uGloss;

    float grain = (random(gl_FragCoord.xy + t) - 0.5) * uGrain;
    color += grain;

    gl_FragColor = vec4(color, 1.0);
  }
`;

function ShaderPlane({
  base,
  highlight,
  secondary,
  noiseScale = 5,
  speed = 0.15,
  distortion = 0.08,
  gloss = 0.8,
  grain = 0.045,
}) {
  const materialRef = useRef(null);
  const { size, viewport } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uBase: { value: new THREE.Color(base) },
      uHighlight: { value: new THREE.Color(highlight) },
      uSecondary: { value: new THREE.Color(secondary) },
      uNoiseScale: { value: noiseScale },
      uSpeed: { value: speed },
      uDistortion: { value: distortion },
      uGloss: { value: gloss },
      uGrain: { value: grain },
    }),
    [base, highlight, secondary, noiseScale, speed, distortion, gloss, grain]
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
        key={`${base}-${highlight}-${secondary}`}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}

export default function LiquidMetalBackground({
  className = '',
  themeId = 'brand',
  bloom,
  vignette,
  ...overrideProps
}) {
  const theme = LOGIN_BG_THEMES.find((t) => t.id === themeId) || LOGIN_BG_THEMES[0];
  const {
    base,
    highlight,
    secondary,
    noiseScale,
    speed,
    distortion,
    gloss,
    grain,
    bloom: themeBloom,
    vignette: themeVignette,
  } = { ...theme, ...overrideProps };

  const bloomIntensity = bloom ?? themeBloom ?? 0.35;
  const vignetteDarkness = vignette ?? themeVignette ?? 0.3;

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-0 ${className}`}
      aria-hidden="true"
      style={{ background: base }}
    >
      <Canvas
        key={theme.id}
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
          base={base}
          highlight={highlight}
          secondary={secondary}
          noiseScale={noiseScale}
          speed={speed}
          distortion={distortion}
          gloss={gloss}
          grain={grain}
        />
        <EffectComposer multisampling={0}>
          <Bloom
            intensity={bloomIntensity}
            luminanceThreshold={0.35}
            luminanceSmoothing={0.45}
            mipmapBlur
          />
          <ChromaticAberration blendFunction={BlendFunction.NORMAL} offset={[0.0008, 0.0006]} />
          <Noise
            premultiply
            blendFunction={BlendFunction.SOFT_LIGHT}
            opacity={Math.min(0.45, 0.12 + grain * 3)}
          />
          <Vignette eskil={false} offset={0.18} darkness={vignetteDarkness} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
