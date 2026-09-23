"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
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
  const groupRef = useRef<THREE.Group>(null);
  // Checked (and corrected, if needed) on every frame rather than in an
  // effect keyed on `size`/`radius`: an effect only runs when React
  // re-renders this component, but Next.js App Router's back/forward
  // navigation can restore this exact component instance without ever
  // re-rendering it — the camera stays fit to whatever it was left at
  // before navigating away, which for a different scroll/layout position
  // reads as the model suddenly huge/misfit. Reading size directly off
  // useFrame's own state (rather than subscribing via useThree, which was
  // the earlier approach) means this check runs regardless of whether
  // React ever re-renders this component at all. Still guarded by the same
  // numeric (not object-identity) comparison as before, so it stays a
  // no-op every other frame and can't reintroduce the drag flicker that
  // motivated that guard in the first place.
  const lastFit = useRef({ width: 0, height: 0, radius: -1 });

  useFrame((state, delta) => {
    const { camera, size } = state;
    if (
      lastFit.current.width !== size.width ||
      lastFit.current.height !== size.height ||
      lastFit.current.radius !== radius
    ) {
      lastFit.current = { width: size.width, height: size.height, radius };

      // Same camera-fit math as PortfolioModelViewer's Model — see that
      // file's comment on why this is done manually instead of via drei's
      // <Bounds>. No OrbitControls here (a grid card is a passive preview,
      // not something to drag/zoom), so there's no controls instance to
      // resync afterward.
      //
      // Fits to BOTH the vertical and horizontal FOV, not just vertical
      // (per feedback: Mask With Holes and CEO Assistant weren't centering
      // right in the grid, only Femmes In Arts Keychain was). This grid
      // tile is portrait (aspect-[4/5], narrower than tall), so the
      // horizontal FOV is tighter than the vertical one — fitting only to
      // vertical (the old code) can still let a model that's wide relative
      // to its height spill past the left/right edges, which reads as
      // "off-center" even though camera.lookAt(0, 0, 0) is already
      // correct. Deriving the horizontal FOV from the camera's own live
      // aspect and fitting to whichever axis needs more distance fixes
      // that regardless of a given model's proportions.
      const perspective = camera as THREE.PerspectiveCamera;
      const verticalFov = (perspective.fov * Math.PI) / 180;
      const verticalDistance = (radius * FIT_MARGIN) / Math.sin(verticalFov / 2);
      const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * perspective.aspect);
      const horizontalDistance = (radius * FIT_MARGIN) / Math.sin(horizontalFov / 2);
      const distance = Math.max(verticalDistance, horizontalDistance);
      camera.position.copy(CAMERA_DIRECTION).multiplyScalar(distance);
      camera.lookAt(0, 0, 0);
      perspective.updateProjectionMatrix();
    }

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
