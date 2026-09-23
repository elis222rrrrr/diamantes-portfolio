"use client";

import { useEffect } from "react";
import { useGLTF } from "@react-three/drei";

type Props = { urls: string[] };

/** Kicks off a background fetch+cache for every Portfolio project's .glb as
 * soon as the grid (app/(site)/portfolio/page.tsx) mounts, not just the ones
 * already shown as a live spinning preview (ProjectCardModelPreview) — most
 * projects show a plain photo in the grid instead, so their model (only
 * used on the detail page) was never touched until the visitor actually
 * clicked through, at which point a multi-MB file (e.g. Femmes In Arts
 * Keychain's ~4.7MB) started fetching+parsing from scratch right as the
 * page needed it — the "lag when click" reported for that project. Renders
 * nothing; useGLTF caches by URL, so PortfolioModelViewer's own useGLTF
 * call on the detail page reuses whatever this already fetched. */
export default function PortfolioModelPreloader({ urls }: Props) {
  useEffect(() => {
    for (const url of urls) {
      // useDraco/useMeshopt disabled — see HeroModel.tsx's identical
      // comment on why useGLTF's defaults are unsafe under this site's CSP.
      useGLTF.preload(url, false, false);
    }
  }, [urls]);

  return null;
}
