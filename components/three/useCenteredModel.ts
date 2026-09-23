"use client";

import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";

/** Loads a .glb, clones it, optionally tints untextured materials, and
 * centers it at the origin — shared by every Portfolio 3D viewer
 * (PortfolioModelViewer's interactive detail-page viewer and
 * ProjectCardModelPreview's spinning grid-card preview), since both need the
 * exact same load/clone/center pipeline and only differ in how they use the
 * camera and interaction around it. */
export function useCenteredModel(url: string, tint?: string) {
  // useDraco/useMeshopt disabled — see HeroModel.tsx's identical comment on
  // why useGLTF's defaults are unsafe under this site's CSP.
  const { scene } = useGLTF(url, false, false);

  return useMemo(() => {
    // scene.clone(true) (plain Object3D clone) doesn't rebind a SkinnedMesh's
    // skeleton to the newly cloned bones — it keeps pointing at the original
    // (shared, useGLTF-cached) bones. Not currently exercised by any
    // rendered model (none of the current portfolio glbs are posed here),
    // but kept over the plain clone so a future rigged/skinned file doesn't
    // silently misbehave — see the git history on PortfolioModelViewer.tsx
    // for the rigged ceo-assistant-robot.glb wave-gesture attempt this was
    // built for: its arm geometry exists but the skin weights don't isolate
    // it from the rest of the body (confirmed by rotating every joint and
    // diffing renders), so that attempt was reverted rather than shipped
    // half-right.
    const clone = cloneSkeleton(scene);
    // Some source .glb files (e.g. vladimiros-logo.glb) ship with no material
    // colors baked in at all — every material falls back to glTF's blank
    // white/metal/rough defaults. `tint` (PortfolioProject.modelTint) lets
    // the admin supply a color for those instead of shipping them blank.
    if (tint) {
      const color = new THREE.Color(tint);
      clone.traverse((node) => {
        if (node instanceof THREE.Mesh) {
          const materials = Array.isArray(node.material) ? node.material : [node.material];
          for (const material of materials) {
            if (material instanceof THREE.MeshStandardMaterial) {
              material.color = color;
              // These files also have no metalness/roughness set, which
              // otherwise defaults to fully metallic/fully rough — nearly
              // black under most lighting. A lighter plastic-like finish
              // reads better for an untextured tint override.
              material.metalness = 0.3;
              material.roughness = 0.4;
            }
          }
        }
      });
    }
    // `precise: true` samples real vertex positions (including skinned/rigged
    // meshes) instead of just each mesh's raw bind-pose geometry box — needed
    // for ceo-assistant-robot.glb (a rigged character), where the imprecise
    // box put the center well below the true visual center and cropped its
    // head. A no-op for the static (non-skinned) logo models.
    const box = new THREE.Box3().setFromObject(clone, true);
    const center = box.getCenter(new THREE.Vector3());
    clone.position.sub(center);
    const sphere = box.getBoundingSphere(new THREE.Sphere());

    return { model: clone, radius: sphere.radius };
  }, [scene, tint]);
}
