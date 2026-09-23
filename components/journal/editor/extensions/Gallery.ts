import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import GalleryView from "./GalleryView";

export type GalleryImage = { url: string; alt: string };

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    gallery: {
      insertGallery: () => ReturnType;
    };
  }
}

/** An atomic image-grid node — its images live entirely in the `images`
 * attribute (JSON), edited via GalleryView's React NodeView rather than
 * ProseMirror content, since "a list of pictures" isn't really rich text. */
export const Gallery = Node.create({
  name: "gallery",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      images: {
        default: [] as GalleryImage[],
        parseHTML: (el: HTMLElement) => {
          try {
            return JSON.parse(el.getAttribute("data-images") ?? "[]");
          } catch {
            return [];
          }
        },
        renderHTML: (attrs: { images: GalleryImage[] }) => ({
          "data-images": JSON.stringify(attrs.images ?? []),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div.journal-gallery" }];
  },

  // Emits real <img> children too, not just the data-images attribute — the
  // attribute is what the editor's NodeView reads back in to reconstruct its
  // interactive state, but plain HTML rendering (the public article page,
  // which has no Tiptap/React runtime) needs actual <img> tags to show
  // anything at all.
  renderHTML({ HTMLAttributes, node }) {
    const images: GalleryImage[] = node.attrs.images ?? [];
    return [
      "div",
      mergeAttributes(HTMLAttributes, { class: "journal-gallery" }),
      ...images.map((img) => ["img", { src: img.url, alt: img.alt, class: "journal-gallery-img" }]),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(GalleryView);
  },

  addCommands() {
    return {
      insertGallery:
        () =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: { images: [] } }),
    };
  },
});
