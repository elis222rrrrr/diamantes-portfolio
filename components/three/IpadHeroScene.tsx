"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrthographicCamera, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import StudioEnvironment from "./StudioEnvironment";

const MODEL_URL = "/models/apple-pencil-ipad-pro.glb";

// Precomputed from the model's own raw glTF-space geometry (see the one-off
// _measure_new_ipad.mjs / _compute_new_ipad.mjs scripts used while wiring
// this up — not shipped; the model's local-space bounding boxes are
// static). This model's native pose is PORTRAIT with its thin/front axis
// on Y (unlike the previous ipad-pro model, whose thin axis was Z) — see
// MODEL_REORIENT below for how it's turned to face the camera in landscape.
// These bounds already account for that reorientation. PortfolioHero's HTML
// carousel overlay is positioned with matching hardcoded percentages so it
// lands exactly over the 3D screen mesh — the two must change together if
// this model or its pose are ever changed.
const CAMERA_BOUNDS = {
  left: 0.005225433232811813,
  right: 0.3531643988825886,
  top: 0.6895628858932205,
  bottom: 0.4006369417286601,
};

// This model's raw axes are X=width, Y=thin/front-facing depth, Z=height —
// a portrait pose with front facing +Y. A plain single-axis Euler turn
// (enough for the previous model, whose front already faced the camera's
// axis) can't both (a) bring the front face around to point at the camera
// and (b) swap which of the two in-plane axes is "wide" for a landscape
// crop. Both at once is a 120° rotation about the (1,1,1) axis — a clean
// permutation of the three axes (world X ← local Z, world Y ← local X,
// world Z ← local Y, i.e. local +Y/front lands on world +Z, facing the
// camera below) with no shear or mirroring. Expressed directly as a
// quaternion rather than stacked Eulers to avoid re-deriving axis order by
// trial and error the way the previous model's Pencil tilt had to.
const MODEL_REORIENT: [number, number, number, number] = [0.5, 0.5, 0.5, 0.5];

function IpadModel({ onReady }: { onReady?: () => void }) {
  // useDraco/useMeshopt disabled — see HeroModel.tsx's identical comment on
  // why useGLTF's defaults are unsafe under this site's CSP.
  const { scene } = useGLTF(MODEL_URL, false, false);
  const { gl, camera } = useThree();
  const [compiled, setCompiled] = useState(false);
  // A ref, not a dependency of the compile effect below, so a new inline
  // callback from the parent on every render (PortfolioHero passes
  // `() => setIpadReady(true)`) never re-triggers gl.compile() — only
  // [scene, gl, camera] should ever do that.
  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useMemo(() => {
    // The model ships a baked-in screen material (a wallpaper texture) on
    // one specific mesh — replace it with plain black so PortfolioHero's
    // HTML carousel overlay (positioned exactly over this mesh) reads as
    // the screen content instead of showing through at the edges. Unlike
    // the previous model, none of this one's meshes are usefully named
    // (GLTFLoader gives every node a generic "Object_N_<Material>_0" name),
    // so this matches the one exact node confirmed — via bounding-box
    // measurement against the "Custom" material's wallpaper texture — to
    // be the screen quad, rather than a name substring.
    scene.traverse((node) => {
      if (node instanceof THREE.Mesh && node.name === "Object_13_Custom_0") {
        node.material = new THREE.MeshBasicMaterial({ color: "#000000" });
      }
    });
  }, [scene]);

  useEffect(() => {
    // Force every material's GPU shader program to compile right now, while
    // still hidden (visible={false} below), instead of letting it happen
    // implicitly on the renderer's first real draw call — the same
    // main-thread stall HeroModel.tsx's ChromeModel measured and fixed
    // (1.2-2.7s there, for a single material). This model carries several
    // distinct materials (Metal/Plastic/Custom/Glass variants), so the same
    // lazy-compile-on-reveal would stall for noticeably longer, and right
    // at the exact moment the model is meant to pop into view. Compiling
    // while invisible moves that cost off-screen; only reveal once it's
    // actually done.
    gl.compile(scene, camera);
    // Deferred a microtask, rather than called directly here, so this
    // doesn't trip the "no setState synchronously in an effect body" lint
    // rule — compile() above is already synchronous, so this still reveals
    // the model on the very next tick, well before the following paint.
    // onReady lets PortfolioHero fade its screen-overlay carousel in only
    // once the 3D iPad itself is actually visible, instead of both popping
    // in independently whenever each happens to finish loading.
    Promise.resolve().then(() => {
      setCompiled(true);
      onReadyRef.current?.();
    });
  }, [scene, gl, camera]);

  return <primitive object={scene} visible={compiled} />;
}

type IpadHeroSceneProps = {
  /** Fires once, the first time the model is fully loaded and its shaders
   * are compiled — i.e. exactly when it's about to become visible. Lets a
   * parent (PortfolioHero) sequence its own HTML content to appear after
   * the 3D model, instead of both popping in independently. */
  onReady?: () => void;
};

/** A fixed (non-orbitable) hero shot of the iPad Pro + Apple Pencil model,
 * reoriented into landscape and framed by an orthographic camera whose
 * bounds are hardcoded to match — see CAMERA_BOUNDS. Deliberately not
 * interactive: PortfolioHero overlays real HTML content in the screen
 * area, and that overlay's position is only valid for this exact,
 * unmoving camera.
 *
 * Model: "Apple Pencil & iPad Pro" by eltayerkebulan
 * (https://sketchfab.com/eltayerkebulan), CC-BY-4.0 — attribution lives in
 * the Portfolio page footer credit line. */
export default function IpadHeroScene({ onReady }: IpadHeroSceneProps) {
  return (
    <Canvas gl={{ antialias: true, alpha: true }} dpr={[1, 2]}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[2, 3, 4]} intensity={0.15} />
      <StudioEnvironment />
      <OrthographicCamera
        makeDefault
        position={[0, 0, 2]}
        left={CAMERA_BOUNDS.left}
        right={CAMERA_BOUNDS.right}
        top={CAMERA_BOUNDS.top}
        bottom={CAMERA_BOUNDS.bottom}
        near={0.05}
        far={4}
      />
      <Suspense fallback={null}>
        <group quaternion={MODEL_REORIENT}>
          <IpadModel onReady={onReady} />
        </group>
      </Suspense>
    </Canvas>
  );
}

// Must match IpadModel's own useGLTF(MODEL_URL, false, false) call above —
// omitting these here (as this line originally did) silently defaults
// drei's preload to useDraco=true, useMeshopt=true, which eagerly
// instantiates the Meshopt WASM decoder on every page load regardless of
// whether this model even uses Meshopt compression (it doesn't). That
// instantiation is blocked by this site's CSP (script-src has no
// 'wasm-unsafe-eval'), throwing a CompileError and burning a large,
// synchronous main-thread stall decoding the decoder's embedded binary
// before it ever gets to fail — see HeroModel.tsx's identical fix.
useGLTF.preload(MODEL_URL, false, false);
