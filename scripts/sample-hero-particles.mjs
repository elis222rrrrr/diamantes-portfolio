// Regenerates components/heroParticlePositions.ts by sampling points
// directly from public/models/baby.glb's actual geometry, in the exact
// coordinate space glTF/Three.js uses to render it (each mesh node's real
// world matrix, via @gltf-transform/core's NodeIO — already present in
// node_modules as a transitive dependency).
//
// The previous version of this data was baked via a Blender headless
// script (see the old header comment in heroParticlePositions.ts). Blender
// is Z-up; glTF/Three.js is Y-up. Sampling in Blender and writing the raw
// coordinates out without converting back is what produced a particle
// cloud shaped like the model but rotated relative to how the real mesh
// actually renders ("the baby, but in another position" — reported after
// that script's own regeneration). This script never leaves glTF's native
// space, so there's no axis conversion to get wrong.
//
// Run: node scripts/sample-hero-particles.mjs
import { NodeIO } from "@gltf-transform/core";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GLB_PATH = path.join(__dirname, "..", "public", "models", "baby.glb");
const OUTPUT_PATH = path.join(__dirname, "..", "components", "heroParticlePositions.ts");
const POINT_COUNT = 1100;

function mat4TransformPoint(m, v) {
  const [x, y, z] = v;
  const w = m[3] * x + m[7] * y + m[11] * z + m[15];
  return [
    (m[0] * x + m[4] * y + m[8] * z + m[12]) / w,
    (m[1] * x + m[5] * y + m[9] * z + m[13]) / w,
    (m[2] * x + m[6] * y + m[10] * z + m[14]) / w,
  ];
}

function sub(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
function cross(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
function length(a) {
  return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
}

async function main() {
  const io = new NodeIO();
  const doc = await io.read(GLB_PATH);
  const scene = doc.getRoot().listScenes()[0];

  const triangles = [];

  scene.traverse((node) => {
    const mesh = node.getMesh();
    if (!mesh) return;
    const worldMatrix = node.getWorldMatrix();

    for (const primitive of mesh.listPrimitives()) {
      if (primitive.getMode() !== 4 /* TRIANGLES */) continue;
      const position = primitive.getAttribute("POSITION");
      if (!position) continue;
      const indices = primitive.getIndices();
      const vertexCount = indices ? indices.getCount() : position.getCount();

      const getVertex = (i) => {
        const local = position.getElement(i, [0, 0, 0]);
        return mat4TransformPoint(worldMatrix, local);
      };

      for (let i = 0; i + 2 < vertexCount; i += 3) {
        const i0 = indices ? indices.getScalar(i) : i;
        const i1 = indices ? indices.getScalar(i + 1) : i + 1;
        const i2 = indices ? indices.getScalar(i + 2) : i + 2;
        const v0 = getVertex(i0);
        const v1 = getVertex(i1);
        const v2 = getVertex(i2);
        const area = length(cross(sub(v1, v0), sub(v2, v0))) / 2;
        if (area > 0) triangles.push({ v0, v1, v2, area });
      }
    }
  });

  if (triangles.length === 0) {
    throw new Error("No triangles found in " + GLB_PATH);
  }

  // The true mesh bounding-box center, computed from every vertex (not
  // just the sampled points) — the exact same Box3.setFromObject a
  // drei <Center> would compute for the real rendered mesh. Baked in here
  // so the exported points are already centered at the origin, matching
  // where the real model ends up after ITS OWN <Center> wrapper; HeroModel
  // no longer wraps the particle field in a second <Center>, since that
  // component only recomputes its box once on mount (drei's Center.js),
  // which would re-center around whatever shape the points had at that
  // instant — wrong once particles start animating toward this target.
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const t of triangles) {
    for (const v of [t.v0, t.v1, t.v2]) {
      for (let a = 0; a < 3; a++) {
        if (v[a] < min[a]) min[a] = v[a];
        if (v[a] > max[a]) max[a] = v[a];
      }
    }
  }
  const center = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2];

  const totalArea = triangles.reduce((sum, t) => sum + t.area, 0);
  const cumulative = [];
  let running = 0;
  for (const t of triangles) {
    running += t.area / totalArea;
    cumulative.push(running);
  }

  function pickTriangle() {
    const r = Math.random();
    let lo = 0;
    let hi = cumulative.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (cumulative[mid] < r) lo = mid + 1;
      else hi = mid;
    }
    return triangles[lo];
  }

  const points = [];
  for (let i = 0; i < POINT_COUNT; i++) {
    const { v0, v1, v2 } = pickTriangle();
    // Uniform-area barycentric sampling (Osada et al.).
    let a = Math.random();
    let b = Math.random();
    if (a + b > 1) {
      a = 1 - a;
      b = 1 - b;
    }
    const c = 1 - a - b;
    points.push([
      v0[0] * c + v1[0] * a + v2[0] * b - center[0],
      v0[1] * c + v1[1] * a + v2[1] * b - center[1],
      v0[2] * c + v1[2] * a + v2[2] * b - center[2],
    ]);
  }

  const flat = points.flatMap((p) => p.map((n) => Math.round(n * 10000) / 10000));

  const lines = [];
  for (let i = 0; i < flat.length; i += 12) {
    lines.push("  " + flat.slice(i, i + 12).join(", ") + ",");
  }
  lines[lines.length - 1] = lines[lines.length - 1].slice(0, -1);

  const output = `// Auto-generated: ${POINT_COUNT} points area-weight-sampled from the surface
// of public/models/baby.glb, in glTF's native coordinate space (each mesh
// node's real world matrix applied via @gltf-transform/core) — the same
// space Three.js renders the model in. Pre-centered here using the TRUE
// mesh bounding box (every vertex, not just these sampled points) — the
// same Box3 a drei <Center> computes for the real mesh — so HeroModel.tsx
// renders this cloud directly, without its own <Center> wrapper: these
// points animate every frame (see ParticleField), and Center only
// measures its bounding box once on mount, which would lock the re-center
// offset to whatever transient shape the points had at that instant.
//
// Regenerate via: node scripts/sample-hero-particles.mjs (after replacing
// public/models/baby.glb).
export const HERO_PARTICLE_POSITIONS: number[] = [
${lines.join("\n")}
];
`;

  writeFileSync(OUTPUT_PATH, output);
  console.log(
    `Wrote ${POINT_COUNT} points (${triangles.length} triangles sampled) to ${OUTPUT_PATH}`
  );
}

main();
