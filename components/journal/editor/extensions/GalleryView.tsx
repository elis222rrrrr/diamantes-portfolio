"use client";

import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { X, Plus } from "lucide-react";
import type { GalleryImage } from "./Gallery";

export default function GalleryView({ node, updateAttributes }: NodeViewProps) {
  const images: GalleryImage[] = node.attrs.images ?? [];

  function addImage() {
    const url = window.prompt("Image URL:");
    if (!url) return;
    const alt = window.prompt("Alt text (for accessibility):") ?? "";
    updateAttributes({ images: [...images, { url, alt }] });
  }

  function removeImage(index: number) {
    updateAttributes({ images: images.filter((_, i) => i !== index) });
  }

  return (
    <NodeViewWrapper className="journal-gallery-editor border border-white/15 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="tracked-label text-xs text-muted">Image gallery</span>
        <button
          type="button"
          onClick={addImage}
          className="focus-ring flex items-center gap-1 text-xs text-white/60 hover:text-white"
        >
          <Plus size={12} /> Add image
        </button>
      </div>
      {images.length === 0 ? (
        <p className="text-xs text-muted">No images yet, click &quot;Add image&quot;.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {images.map((img, i) => (
            <div key={i} className="group relative aspect-square overflow-hidden bg-white/5">
              {/* eslint-disable-next-line @next/next/no-img-element -- editor preview only, not the rendered article (which uses next/image via ArticleContent) */}
              <img src={img.url} alt={img.alt} className="h-full w-full object-cover" />
              {/* Always at least partly visible (not opacity-0 until hover) —
                  hover has no touch equivalent, which made this undiscoverable
                  on a phone/tablet editing session. */}
              <button
                type="button"
                aria-label="Remove image"
                onClick={() => removeImage(i)}
                className="focus-ring absolute right-1 top-1 bg-black/70 p-1.5 text-white opacity-70 transition hover:opacity-100 group-hover:opacity-100"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </NodeViewWrapper>
  );
}
