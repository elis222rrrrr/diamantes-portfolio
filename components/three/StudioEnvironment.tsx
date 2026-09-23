"use client";

import { memo } from "react";
import { Environment, Lightformer } from "@react-three/drei";

/** A bright, neutral 3-point studio rig — NOT the Hero's baked cubemap
 * (components/HeroModel.tsx's ENV_FILES). That cubemap was baked from a dark,
 * moody rig built for a chrome bust and renders arbitrary portfolio models'
 * metallic materials near-black. Portfolio models are arbitrary client work
 * (bright, saturated colors are usually the point), so this stays a small
 * live Lightformer bake instead — procedural, so it needs no CDN fetch
 * (CSP-safe) and no per-model baked-PNG asset. Memoized for the same reason
 * HeroModel memoizes its environment: inline Lightformer children are a new
 * object reference on every re-render, which forces an expensive PMREM
 * re-bake. Shared by every Portfolio 3D viewer (the detail-page viewer and
 * the grid-card preview) so they light models identically. */
const StudioEnvironment = memo(function StudioEnvironment() {
  return (
    <Environment background={false}>
      <Lightformer intensity={2} position={[0, 5, 0]} scale={[8, 8, 1]} color="white" />
      <Lightformer intensity={1.2} position={[3, 1, 3]} scale={[4, 4, 1]} color="white" />
      <Lightformer intensity={0.6} position={[-3, 1, -2]} scale={[4, 4, 1]} color="white" />
    </Environment>
  );
});

export default StudioEnvironment;
