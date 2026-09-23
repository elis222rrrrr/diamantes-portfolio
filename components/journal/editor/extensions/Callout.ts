import { Node, mergeAttributes } from "@tiptap/core";

export type CalloutVariant = "info" | "tip" | "warning";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (variant: CalloutVariant) => ReturnType;
    };
  }
}

/** A block that holds normal rich-text content (paragraphs, lists, links)
 * inside a styled box — no custom NodeView needed since editing inside it is
 * just ordinary ProseMirror content editing. */
export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,

  addAttributes() {
    return {
      variant: {
        default: "info" as CalloutVariant,
        parseHTML: (el: HTMLElement) => el.getAttribute("data-variant") ?? "info",
        renderHTML: (attrs: { variant: CalloutVariant }) => ({ "data-variant": attrs.variant }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[class="journal-callout"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { class: "journal-callout" }), 0];
  },

  addCommands() {
    return {
      setCallout:
        (variant: CalloutVariant) =>
        ({ commands }) =>
          commands.wrapIn(this.name, { variant }),
    };
  },
});
