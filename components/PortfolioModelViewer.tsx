"use client";

import { Suspense, useEffect, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import StudioEnvironment from "@/components/three/StudioEnvironment";
import { useCenteredModel } from "@/components/three/useCenteredModel";

// Direction only — the actual distance is computed per-model in Model below
// (from its true bounding sphere), then applied along this direction. Mostly
// frontal with a slight downward tilt (not a steep near-overhead angle) —
// that's what reads correctly for both flat logo plaques (letrion-ai,
// vladimiros) and taller upright models (ceo-assistant-robot), which a
// steeper top-down angle hides behind their own head/top face.
const CAMERA_DIRECTION = new THREE.Vector3(0, 1, 2).normalize();
// Polar angle (from +Y) matching CAMERA_DIRECTION — OrbitControls locks to
// this so dragging only spins the model (azimuth), never tilts it.
const INITIAL_POLAR_ANGLE = Math.atan2(2, 1);
const FIT_MARGIN = 1.4;

function Model({ url, tint }: { url: string; tint?: string }) {
  const { model, radius } = useCenteredModel(url, tint);
  const camera = useThree((state) => state.camera);
  const controls = useThree((state) => state.controls) as {
    update: () => void;
    minDistance: number;
    maxDistance: number;
  } | null;
  const size = useThree((state) => state.size);
  // R3F hands out a fresh `size` object on every resize-observer callback,
  // including ones that fire with the SAME width/height — confirmed
  // directly: an earlier version of this effect that depended on `size`
  // without this guard reset the camera (fighting OrbitControls) on every
  // one of those, reading as the model jumping/flickering while being
  // dragged. Tracking the last-FIT numeric size (and radius, so a
  // genuinely new model still refits even at an unchanged container size)
  // and bailing out unless either actually changed keeps the refit limited
  // to real resizes — including a container reused, not remounted, across
  // a cached navigation and coming back at a different real size, which is
  // the original bug this was meant to fix — without re-firing on noise.
  const lastFit = useRef({ width: 0, height: 0, radius: -1 });

  // Positions the camera along CAMERA_DIRECTION at whatever distance fits
  // this model's real size — replaces drei's <Bounds>, which computes its
  // own (imprecise, non-skin-aware) box internally and can't be handed a
  // precomputed one. controls.update() resyncs OrbitControls' internal
  // spherical state to the new camera position (it otherwise only reads
  // camera.position once, on mount).
  /* eslint-disable react-hooks/immutability -- this whole effect mutates
     `controls`, an imperative three.js object (not React state); disabling
     the block rather than a single line since the exact line the plugin
     anchors its diagnostic to shifted each time this effect's body changed
     shape. */
  useEffect(() => {
    if (
      lastFit.current.width === size.width &&
      lastFit.current.height === size.height &&
      lastFit.current.radius === radius
    ) {
      return;
    }
    lastFit.current = { width: size.width, height: size.height, radius };

    const perspective = camera as THREE.PerspectiveCamera;
    const verticalFov = (perspective.fov * Math.PI) / 180;
    const distance = (radius * FIT_MARGIN) / Math.sin(verticalFov / 2);
    camera.position.copy(CAMERA_DIRECTION).multiplyScalar(distance);
    camera.lookAt(0, 0, 0);
    perspective.updateProjectionMatrix();
    if (controls) {
      // Scroll-to-zoom range scaled to this model's real size, replacing the
      // fixed min/maxDistance the old <Bounds clip> derived automatically.
      controls.minDistance = radius * 0.6;
      controls.maxDistance = distance * 3;
      controls.update();
    }
  }, [camera, controls, radius, size]);
  /* eslint-enable react-hooks/immutability */

  return <primitive object={model} />;
}

type Props = {
  /** Path to a .glb, e.g. "/models/letrion-ai-logo.glb". */
  url: string;
  /** Hex color override for files with no baked-in material colors (see
   * useCenteredModel). */
  tint?: string;
};

/** A small, generic interactive 3D viewer for Portfolio detail pages —
 * unlike HeroModel.tsx, renders the file's own baked materials as-is (no
 * chrome override), since these are one-off client/logo models where the
 * original colors are the point. Kept deliberately simple: no
 * loading-transition choreography, since the files this is meant for are
 * tiny (a few KB to a couple hundred KB) and load close to instantly. */
export default function PortfolioModelViewer({ url, tint }: Props) {
  return (
    <div className="aspect-square w-full border border-white/10">
      <Canvas
        // Just an initial placeholder — Model repositions the camera along
        // CAMERA_DIRECTION once the real model size is known.
        camera={{ position: [0, 1, 2], fov: 35 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 3, 4]} intensity={0.6} />
        <StudioEnvironment />
        <Suspense fallback={null}>
          <Model url={url} tint={tint} />
        </Suspense>
        <OrbitControls
          makeDefault
          enablePan={false}
          autoRotate
          autoRotateSpeed={1.2}
          // Locks tilt to the initial camera angle — dragging only spins the
          // model around Y (matching the "Drag to rotate" hint below), no
          // up/down orbiting.
          minPolarAngle={INITIAL_POLAR_ANGLE}
          maxPolarAngle={INITIAL_POLAR_ANGLE}
        />
      </Canvas>
    </div>
  );
}
