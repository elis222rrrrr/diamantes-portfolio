"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
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
  // Checked (and corrected, if needed) on every frame rather than in an
  // effect keyed on `size`/`radius`: an effect only runs when React
  // re-renders this component, but Next.js App Router's back/forward
  // navigation can restore this exact component instance without ever
  // re-rendering it — the camera stays fit to whatever it was left at
  // before navigating away, which for a different scroll/layout position
  // reads as the model suddenly huge/misfit. Reading size/camera/controls
  // directly off useFrame's own state (rather than subscribing via
  // useThree, which was the earlier approach) means this check runs
  // regardless of whether React ever re-renders this component at all.
  // Still guarded by the same numeric (not object-identity) comparison as
  // before, so it stays a no-op every other frame and can't reintroduce
  // the drag flicker that motivated that guard in the first place.
  const lastFit = useRef({ width: 0, height: 0, radius: -1 });

  useFrame((state) => {
    const { camera, size } = state;
    const controls = state.controls as {
      update: () => void;
      minDistance: number;
      maxDistance: number;
    } | null;
    if (
      lastFit.current.width === size.width &&
      lastFit.current.height === size.height &&
      lastFit.current.radius === radius
    ) {
      return;
    }
    lastFit.current = { width: size.width, height: size.height, radius };

    // Positions the camera along CAMERA_DIRECTION at whatever distance fits
    // this model's real size — replaces drei's <Bounds>, which computes its
    // own (imprecise, non-skin-aware) box internally and can't be handed a
    // precomputed one. controls.update() resyncs OrbitControls' internal
    // spherical state to the new camera position (it otherwise only reads
    // camera.position once, on mount).
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
  });

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
