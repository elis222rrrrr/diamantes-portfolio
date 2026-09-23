"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { createLowlight, common } from "lowlight";
import Youtube from "@tiptap/extension-youtube";
import Placeholder from "@tiptap/extension-placeholder";
import { Callout } from "./extensions/Callout";
import { ButtonNode } from "./extensions/ButtonNode";
import { Gallery } from "./extensions/Gallery";
import Toolbar from "./Toolbar";

const lowlight = createLowlight(common);

type Props = {
  content: string;
  onChange: (html: string) => void;
};

/** The Journal's rich text editor — Tiptap, with tables/images/YouTube/code
 * blocks plus three custom nodes (callout, CTA button, image gallery) this
 * app doesn't get from any stock extension. `content`/`onChange` is a plain
 * controlled-HTML contract so the surrounding article form doesn't need to
 * know anything about Tiptap. */
export default function RichTextEditor({ content, onChange }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Underline,
      Link.configure({ openOnClick: false }),
      ImageExtension,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      CodeBlockLowlight.configure({ lowlight }),
      Youtube.configure({ width: 640, height: 360 }),
      Placeholder.configure({ placeholder: "Write the article…" }),
      Callout,
      ButtonNode,
      Gallery,
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "journal-prose min-h-[400px] px-4 py-4 focus:outline-none",
      },
    },
  });

  if (!editor) return null;

  return (
    <div className="border border-white/15">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
