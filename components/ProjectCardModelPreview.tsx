"use client";

import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import StudioEnvironment from "@/components/three/StudioEnvironment";
import { useCenteredModel } from "@/components/three/useCenteredModel";

// Same viewing direction as PortfolioModelViewer's detail-page viewer, for a
// consistent look between the grid card and the detail page — see that
// file's identical constant for why this angle (not steep top-down).
const CAMERA_DIRECTION = new THREE.Vector3(0, 1, 2).normalize();
const FIT_MARGIN = 1.5;
const SPIN_RADIANS_PER_SECOND = 0.5;

function SpinningModel({ url, tint }: { url: string; tint?: string }) {
  const { model, radius } = useCenteredModel(url, tint);
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const groupRef = useRef<THREE.Group>(null);
  // R3F hands out a fresh `size` object on every resize-observer callback,
  // including ones that fire with the SAME width/height (confirmed: this
  // is exactly what made an earlier version of this fix jump/flicker
  // during interaction on PortfolioModelViewer's identical pattern — the
  // effect re-ran, and re-ran, off object-identity changes alone). Tracking
  // the last-FIT numeric size (and radius, so a genuinely new model still
  // refits even if the container's size hasn't changed) and bailing out
  // unless either actually changed keeps the refit limited to real resizes
  // (including a container that was reused, not remounted, across a cached
  // navigation and came back at a different real size) without re-firing
  // on noise.
  const lastFit = useRef({ width: 0, height: 0, radius: -1 });

  // Same camera-fit math as PortfolioModelViewer's Model — see that file's
  // comment on why this is done manually instead of via drei's <Bounds>.
  // No OrbitControls here (a grid card is a passive preview, not something
  // to drag/zoom), so there's no controls instance to resync afterward.
  //
  // Fits to BOTH the vertical and horizontal FOV, not just vertical (per
  // feedback: Mask With Holes and CEO Assistant weren't centering right in
  // the grid, only Femmes In Arts Keychain was). This grid tile is portrait
  // (aspect-[4/5], narrower than tall), so the horizontal FOV is tighter
  // than the vertical one — fitting only to vertical (the old code) can
  // still let a model that's wide relative to its height spill past the
  // left/right edges, which reads as "off-center" even though
  // camera.lookAt(0, 0, 0) is already correct. Deriving the horizontal FOV
  // from the camera's own live aspect and fitting to whichever axis needs
  // more distance fixes that regardless of a given model's proportions.
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
    const verticalDistance = (radius * FIT_MARGIN) / Math.sin(verticalFov / 2);
    const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * perspective.aspect);
    const horizontalDistance = (radius * FIT_MARGIN) / Math.sin(horizontalFov / 2);
    const distance = Math.max(verticalDistance, horizontalDistance);
    camera.position.copy(CAMERA_DIRECTION).multiplyScalar(distance);
    camera.lookAt(0, 0, 0);
    perspective.updateProjectionMatrix();
  }, [camera, radius, size]);

  useFrame((_state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * SPIN_RADIANS_PER_SECOND;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={model} />
    </group>
  );
}

type Props = {
  /** Path to a .glb, e.g. "/models/ceo-assistant-robot.glb". */
  url: string;
  /** Hex color override for files with no baked-in material colors (see
   * components/three/useCenteredModel.ts). */
  tint?: string;
};

/** A passive, continuously-spinning 3D preview for Portfolio grid cards
 * (components/ProjectGrid.tsx) — shown instead of the plain accent-gradient
 * fallback for projects that have a .glb but no card image (currently just
 * "CEO Assistant"), so the model reads as alive before a visitor ever clicks
 * through to the detail page. Unlike PortfolioModelViewer (the detail page's
 * interactive viewer), there's no drag-to-rotate/scroll-to-zoom — a grid
 * card is glanced at, not manipulated, so this just spins on its own. */
export default function ProjectCardModelPreview({ url, tint }: Props) {
  return (
    <Canvas
      // Explicit absolute-fill, matching the <Image fill> sibling in
      // ProjectGrid.tsx — without this, the canvas relied on the R3F
      // default sizing, which didn't reliably center within this grid
      // tile's aspect-[4/5] frame across every model (per feedback, only
      // Femmes In Arts Keychain was actually centering correctly).
      className="absolute inset-0 h-full w-full"
      camera={{ position: [0, 1, 2], fov: 35 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 3, 4]} intensity={0.6} />
      <StudioEnvironment />
      <Suspense fallback={null}>
        <SpinningModel url={url} tint={tint} />
      </Suspense>
    </Canvas>
  );
}
