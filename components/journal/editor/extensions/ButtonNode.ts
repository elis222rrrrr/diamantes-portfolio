import { Node, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    ctaButton: {
      insertCtaButton: (attrs: { label: string; href: string }) => ReturnType;
    };
  }
}

/** An atomic CTA link — no editable children; label/href are set once at
 * insertion time via the toolbar's prompt. */
export const ButtonNode = Node.create({
  name: "ctaButton",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      label: { default: "Learn more" },
      href: { default: "#" },
    };
  },

  parseHTML() {
    return [{ tag: "a.journal-button-cta" }];
  },

  renderHTML({ HTMLAttributes, node }) {
    return [
      "a",
      mergeAttributes(HTMLAttributes, {
        class: "journal-button-cta",
        href: node.attrs.href,
        target: "_blank",
        rel: "noopener noreferrer",
      }),
      node.attrs.label,
    ];
  },

  addCommands() {
    return {
      insertCtaButton:
        (attrs: { label: string; href: string }) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    };
  },
});
