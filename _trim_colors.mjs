import sharp from "sharp";

const dir =
  "C:/Users/elisa/AppData/Local/Temp/claude/c--Users-elisa-diamantes3designs/384d015d-525c-4708-a20c-a99d607dcb26/scratchpad/tsanta_render";

// Fixed, identical crop box for all three — derived from the black render's
// trim() result (highest-contrast against the gray backdrop, so the most
// reliable bbox). Camera/object position is identical across all three
// renders, but trim()'s own per-image edge detection is NOT reliable
// across different material colors (silver/white blend into the gray
// background at anti-aliased edges far more than black does), so letting
// each image pick its own crop box produced three different scales/framings
// that wouldn't match when swapped via the color selector.
// Sharp's trim() proved unreliable here (subtle Cycles render noise across
// the flat background read as "content" over a wide area, producing a box
// far looser than the object's actual silhouette) — this was computed by
// directly scanning raw pixels for anything >14/255 away from the sampled
// background color (200,200,202).
const CROP = { left: 419, top: 500, width: 761, height: 602 };

for (const color of ["silver", "white", "black"]) {
  const src = `${dir}/front_${color}.png`;
  const out = `${dir}/front_${color}_trimmed.png`;
  await sharp(src)
    .extract(CROP)
    .extend({ top: 110, bottom: 110, left: 110, right: 110, background: "#c8c8ca" })
    .toFile(out);
  const meta = await sharp(out).metadata();
  console.log(color, "->", meta.width, meta.height);
}
