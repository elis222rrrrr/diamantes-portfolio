"use client";

import {
  memo,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Center, Environment, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type {
  Group,
  Mesh,
  MeshStandardMaterial,
  Points as PointsType,
  PointsMaterial,
} from "three";
import { HERO_PARTICLE_POSITIONS } from "./heroParticlePositions";

const MODEL_PATH = "/models/baby.glb";
const PARTICLE_POSITIONS = new Float32Array(HERO_PARTICLE_POSITIONS);

// A stable (module-scope, not inline-in-JSX) no-op attach — an inline arrow
// function would be a new reference every render, causing R3F to detach and
// reattach this material each time ChromeModel re-renders for no reason.
function noopAttach() {
  return () => {};
}

// Same near-white/near-black pair the rest of the site uses per theme (see
// --foreground in globals.css) — near-white particles read fine against the
// dark theme's black canvas, but are nearly invisible on the light theme's
// white one, so the particle color needs to flip with it.
const PARTICLE_COLOR_DARK_THEME = "#f4f6f9";
const PARTICLE_COLOR_LIGHT_THEME = "#111111";

function subscribeToThemeChange(listener: () => void): () => void {
  window.addEventListener("d3d-theme-changed", listener);
  return () => window.removeEventListener("d3d-theme-changed", listener);
}

function getThemeSnapshot(): "light" | "dark" {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function getThemeServerSnapshot(): "light" | "dark" {
  return "light";
}

function useTheme(): "light" | "dark" {
  return useSyncExternalStore(subscribeToThemeChange, getThemeSnapshot, getThemeServerSnapshot);
}

function usesReducedMotion(): boolean {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

// A slow, gentle scale pulse — like breathing — rather than a spin.
const BREATH_SPEED = 0.6; // radians/sec fed into sin()
const BREATH_AMPLITUDE = 0.035; // +/- 3.5% scale

// Both the particle fade-out and the model fade-in below ramp linearly over
// this exact same window, anchored to the same modelReady flip — that's
// what keeps them complementary (opacities always sum to ~1) instead of
// drifting in and out of sync on two different easing curves, which is
// what read as a "weird" seam/flicker right at the handoff.
const FADE_SECONDS = 1.8;
const PARTICLE_FADE_IN_DAMPING = 12; // snappy — the effect should be visible almost immediately

// However fast the model actually loads, keep the particle effect on screen
// at least this long so it's actually seen rather than flashing by.
const MIN_PARTICLE_SECONDS = 2200;

// The particles fly in from a random scatter around their target position
// (rather than just fading in already in-place) and keep a faint idle
// drift once assembled, so the effect reads as "moving particles" instead
// of a static dot cloud that only changes opacity.
const CONVERGE_SECONDS = 1.6;
const SCATTER_MIN = 0.35;
const SCATTER_MAX = 0.9;
const DRIFT_AMPLITUDE = 0.012;
const DRIFT_SPEED = 0.9;

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

const PARTICLE_COUNT = PARTICLE_POSITIONS.length / 3;

// Computed once at module load, not inside the component: Math.random() is
// an impure call the React Compiler's lint rules forbid during render (or
// inside a useMemo factory, since that's still "during render" as far as
// purity is concerned) — same reasoning as the seeded-PRNG pattern used
// elsewhere on this site for decorative randomness, just simpler here
// since this data never needs to be regenerated or match SSR output.
function buildScatterAndDrift(): { start: Float32Array; drift: Float32Array } {
  const start = new Float32Array(PARTICLE_POSITIONS.length);
  const drift = new Float32Array(PARTICLE_COUNT * 2);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const dir = new THREE.Vector3(
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1
    )
      .normalize()
      .multiplyScalar(SCATTER_MIN + Math.random() * (SCATTER_MAX - SCATTER_MIN));
    start[i * 3] = PARTICLE_POSITIONS[i * 3] + dir.x;
    start[i * 3 + 1] = PARTICLE_POSITIONS[i * 3 + 1] + dir.y;
    start[i * 3 + 2] = PARTICLE_POSITIONS[i * 3 + 2] + dir.z;
    drift[i * 2] = Math.random() * Math.PI * 2;
    drift[i * 2 + 1] = 0.6 + Math.random() * 0.8;
  }
  return { start, drift };
}
const { start: PARTICLE_START_POSITIONS, drift: PARTICLE_DRIFT_SEEDS } = buildScatterAndDrift();

// The buffer actually handed to <bufferAttribute> and mutated in place every
// frame. Module-scope, like PARTICLE_POSITIONS itself above — not a ref or
// useMemo: this is only ever mounted once (there's a single <HeroModel/> on
// the page), and the React Compiler's immutability lint rule treats a
// useMemo's return value (and a ref read during render, for the JSX below)
// as off-limits to mutate/read that way — a plain module binding isn't
// hook-tracked, so it's outside that rule entirely, same as PARTICLE_POSITIONS.
const PARTICLE_LIVE_POSITIONS = new Float32Array(PARTICLE_POSITIONS);

/** A cloud of points sampled from the real model's surface (see
 * heroParticlePositions.ts) — shown while the ~166KB model loads, so the
 * shape reads as "assembling from particles" rather than a blank gap
 * followed by a pop-in. Fades out once the real mesh is ready.
 *
 * Not wrapped in drei's <Center>: heroParticlePositions.ts already bakes
 * in the real mesh's true bounding-box center (see that file's header),
 * and these positions are mutated every frame below — Center only
 * measures its bounding box once on mount (see its source), which would
 * lock the re-center offset to whatever transient scattered shape the
 * points happened to have at that instant, not the assembled target.
 *
 * The geometry/material are declared as JSX (not `new THREE.X()` + useMemo)
 * so refs are only ever dereferenced inside useFrame, never during render —
 * mutating a useMemo-returned object directly, or reading a ref's .current
 * during render, both trip the React Compiler's lint rules here. */
function ParticleField({ active }: { active: boolean }) {
  const pointsRef = useRef<PointsType>(null);
  const materialRef = useRef<PointsMaterial>(null);
  const reduceMotion = useMemo(() => usesReducedMotion(), []);
  const theme = useTheme();
  const particleColor = theme === "light" ? PARTICLE_COLOR_LIGHT_THEME : PARTICLE_COLOR_DARK_THEME;

  const assembleSinceRef = useRef<number | null>(null);
  const readySinceRef = useRef<number | null>(null);

  useFrame(({ clock }, delta) => {
    const material = materialRef.current;

    if (active) {
      readySinceRef.current = null;
      if (assembleSinceRef.current === null) assembleSinceRef.current = clock.elapsedTime;
    } else if (readySinceRef.current === null) {
      readySinceRef.current = clock.elapsedTime;
    }

    if (material) {
      if (active) {
        material.opacity = THREE.MathUtils.damp(
          material.opacity,
          1,
          PARTICLE_FADE_IN_DAMPING,
          delta
        );
      } else {
        const sinceReady =
          readySinceRef.current === null ? 0 : clock.elapsedTime - readySinceRef.current;
        material.opacity = Math.max(0, 1 - sinceReady / FADE_SECONDS);
      }
    }

    // Once fully faded out there's nothing left to see, so skip the
    // per-particle position work below entirely rather than mutating an
    // invisible buffer forever (this component stays mounted for the rest
    // of the page's life).
    const stillVisible = active || !material || material.opacity > 0.001;

    if (!reduceMotion && stillVisible) {
      const sinceAssemble =
        assembleSinceRef.current === null ? 0 : clock.elapsedTime - assembleSinceRef.current;
      const converge = easeOutCubic(Math.min(sinceAssemble / CONVERGE_SECONDS, 1));
      const driftStrength = active ? 1 : 0.35;
      const t = clock.elapsedTime;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        const phase = PARTICLE_DRIFT_SEEDS[i * 2];
        const speed = PARTICLE_DRIFT_SEEDS[i * 2 + 1];
        const bx = THREE.MathUtils.lerp(
          PARTICLE_START_POSITIONS[i3],
          PARTICLE_POSITIONS[i3],
          converge
        );
        const by = THREE.MathUtils.lerp(
          PARTICLE_START_POSITIONS[i3 + 1],
          PARTICLE_POSITIONS[i3 + 1],
          converge
        );
        const bz = THREE.MathUtils.lerp(
          PARTICLE_START_POSITIONS[i3 + 2],
          PARTICLE_POSITIONS[i3 + 2],
          converge
        );
        PARTICLE_LIVE_POSITIONS[i3] =
          bx + Math.sin(t * DRIFT_SPEED * speed + phase) * DRIFT_AMPLITUDE * driftStrength;
        PARTICLE_LIVE_POSITIONS[i3 + 1] =
          by +
          Math.sin(t * DRIFT_SPEED * speed * 1.3 + phase + 2.1) *
            DRIFT_AMPLITUDE *
            0.8 *
            driftStrength;
        PARTICLE_LIVE_POSITIONS[i3 + 2] =
          bz +
          Math.sin(t * DRIFT_SPEED * speed * 0.7 + phase + 4.2) *
            DRIFT_AMPLITUDE *
            0.6 *
            driftStrength;
      }

      const attr = pointsRef.current?.geometry.attributes.position as
        THREE.BufferAttribute | undefined;
      if (attr) attr.needsUpdate = true;

      if (pointsRef.current) {
        const scale = 1 + Math.sin(t * BREATH_SPEED) * BREATH_AMPLITUDE;
        pointsRef.current.scale.setScalar(scale);
      }
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[PARTICLE_LIVE_POSITIONS, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        color={particleColor}
        // Bumped from 0.012 — verified via an independent render that the
        // resampled particle data (see heroParticlePositions.ts) traces
        // the model's real silhouette correctly, but at the old size,
        // 1,100 dots spread across a complex curled shape likely read as
        // too sparse/small to connect into a recognizable outline at
        // actual on-page viewing size.
        size={0.02}
        sizeAttenuation
        transparent
        opacity={0}
        depthWrite={false}
      />
    </points>
  );
}

/** `active` gates only the visible crossfade timing — the component itself
 * mounts immediately (see HeroModel below), so the model loads and its
 * shader compiles well before it's ever meant to be seen. Three.js compiles
 * a material's GLSL shader lazily on its first actual draw call, which is a
 * synchronous, sometimes multi-second stall (worse on weaker GPUs/software
 * rendering) — measured via repeated trials that consistently showed a
 * 1.2-2.7s main-thread stall exactly when the model first appeared. Doing
 * that first draw at opacity 0 during the particle phase, instead of at the
 * crossfade moment, is what fixes the "flicker": the expensive part now
 * happens off-screen instead of visibly freezing the transition. */
function ChromeModel({ active, onCompiled }: { active: boolean; onCompiled: () => void }) {
  // useDraco/useMeshopt explicitly disabled: neither compression is used by
  // this file, but useGLTF defaults both to true, which eagerly instantiates
  // a Meshopt WASM decoder on every call regardless — blocked by this site's
  // CSP (script-src has no 'wasm-unsafe-eval'), and the failed instantiation
  // plus JS fallback compilation is what caused the loading-transition stall
  // measured via repeated trials (a consistent ~1.4-1.7s main-thread block).
  const { scene } = useGLTF(MODEL_PATH, false, false);
  const { gl, camera } = useThree();
  const groupRef = useRef<Group>(null);
  const materialRef = useRef<MeshStandardMaterial>(null);
  const reduceMotion = useMemo(() => usesReducedMotion(), []);
  const activeSinceClockRef = useRef<number | null>(null);

  const model = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    const material = materialRef.current;
    if (!material) return;
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        (child as Mesh).material = material;
        // Simplification changes topology, so normals are recomputed fresh
        // here rather than trusting whatever the source file shipped with.
        child.geometry.computeVertexNormals();
      }
    });
    // Forces shader compilation now (still invisible at opacity 0) rather
    // than leaving it to happen implicitly on whatever frame first draws it.
    // Measured directly: clone+traverse+normals together cost under 5ms —
    // compiling this PBR (metalness/roughness) shader is the entire cost,
    // consistently ~300-450ms. That's the GPU driver compiling GLSL, not
    // anything in this component. Tried compileAsync() for this (so browsers
    // with KHR_parallel_shader_compile run it off this thread instead of
    // blocking here) but it throws internally in this three.js version
    // ("Cannot read properties of undefined (reading 'isReady')") — reverted
    // to the plain synchronous compile(), which is reliable if not async.
    gl.compile(model, camera);
    // Only now — after useGLTF has actually resolved (this component only
    // exists past its <Suspense> boundary at all) AND the expensive shader
    // compile above has actually run — is this model genuinely ready to
    // draw without a stall. HeroModel used to guess readiness from an
    // unrelated raw fetch() of the model bytes, which said nothing about
    // whether THIS Suspense boundary had resolved; when parsing/compiling
    // outlasted that guess, ParticleField started fading out while this
    // component was still suspended rendering nothing at all — a real gap,
    // showing inconsistently depending on timing (per feedback: "sometimes
    // shows the baby [particles] first before the model"). Signaling real
    // readiness here instead of guessing removes that race entirely.
    onCompiled();
  }, [model, gl, camera, onCompiled]);

  useFrame(({ clock }) => {
    if (active && activeSinceClockRef.current === null) {
      activeSinceClockRef.current = clock.elapsedTime;
    }

    if (materialRef.current) {
      const sinceActive =
        activeSinceClockRef.current === null ? 0 : clock.elapsedTime - activeSinceClockRef.current;
      materialRef.current.opacity = active ? Math.min(sinceActive / FADE_SECONDS, 1) : 0;
    }

    if (reduceMotion || !groupRef.current) return;
    const scale = 1 + Math.sin(clock.elapsedTime * BREATH_SPEED) * BREATH_AMPLITUDE;
    groupRef.current.scale.setScalar(scale);
  });

  return (
    <Center>
      <group ref={groupRef}>
        <primitive object={model} />
      </group>
      {/* Constructed here purely so R3F creates+refs the instance; assigned
          onto the loaded scene's meshes imperatively above. A no-op `attach`
          stops R3F from also assigning it as the parent group's .material
          (which isn't a real property Group uses, but has no reason to touch). */}
      <meshStandardMaterial
        ref={materialRef}
        attach={noopAttach}
        color="#f4f6f9"
        metalness={1}
        roughness={0.22}
        envMapIntensity={1.1}
        transparent
        opacity={0}
      />
    </Center>
  );
}

useGLTF.preload(MODEL_PATH, false, false);

// Six 64x64 PNG faces baked once, offline (see _bake/ at the repo root, not
// shipped), from the exact same 3-Lightformer setup this used to generate
// live on every page load via drei's <Environment>. That runtime bake was a
// genuinely expensive multi-pass cubemap render — measured at 1-1.8s, and
// firing twice (once on mount, again whenever HeroModel re-rendered, since
// inline Lightformer JSX is a new object reference every time) — exactly
// the "flicker"/lag reported during loading. A static texture removes that
// cost entirely: this is now just a tiny image decode, not a render.
const ENV_FILES = [
  "/models/env/px.png",
  "/models/env/nx.png",
  "/models/env/py.png",
  "/models/env/ny.png",
  "/models/env/pz.png",
  "/models/env/nz.png",
];

const HeroEnvironment = memo(function HeroEnvironment() {
  return <Environment files={ENV_FILES} background={false} />;
});

/** The 3D form behind "DIAMANTES DESIGNS" — replaces the earlier CSS-gradient
 * placeholder. Lazy-mounted client-side only (see Hero.tsx's dynamic import
 * with ssr:false), so it never competes with the h1's LCP paint. Lighting
 * reflections come from a small self-hosted static cubemap (see ENV_FILES
 * above) rather than a fetched HDRI or a live runtime bake, keeping this
 * both self-contained/CSP-clean and cheap to load.
 *
 * modelReady only flips once BOTH the minimum particle display time has
 * elapsed AND ChromeModel itself has confirmed it's actually compiled and
 * ready (via onModelCompiled below) — not from a raw fetch() of the model
 * bytes, which used to guess readiness independently of whether useGLTF's
 * <Suspense> boundary and the shader compile had actually finished. That
 * guess could resolve before the real thing did, starting the particle
 * fade-out while ChromeModel was still suspended rendering nothing — a
 * real gap, appearing inconsistently depending on load timing (per
 * feedback: "sometimes shows the baby before the model"). */
export default function HeroModel() {
  const [minDelayElapsed, setMinDelayElapsed] = useState(false);
  const [modelCompiled, setModelCompiled] = useState(false);
  const modelReady = minDelayElapsed && modelCompiled;

  useEffect(() => {
    const id = setTimeout(() => setMinDelayElapsed(true), MIN_PARTICLE_SECONDS);
    return () => clearTimeout(id);
  }, []);

  const handleModelCompiled = useCallback(() => setModelCompiled(true), []);

  return (
    <Canvas
      camera={{ position: [0, 0, 2.4], fov: 35 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
    >
      <ambientLight intensity={0.45} />
      <directionalLight position={[2, 3, 4]} intensity={0.55} />
      <HeroEnvironment />
      <ParticleField active={!modelReady} />
      <Suspense fallback={null}>
        <ChromeModel active={modelReady} onCompiled={handleModelCompiled} />
      </Suspense>
    </Canvas>
  );
}
