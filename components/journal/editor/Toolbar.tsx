"use client";

import type { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  UnderlineIcon,
  List,
  ListOrdered,
  Quote,
  LinkIcon,
  Table as TableIcon,
  ImageIcon,
  Video as YoutubeIcon,
  Code,
  Minus,
  Undo,
  Redo,
  Images,
  MousePointerClick,
  Info,
  Lightbulb,
  AlertTriangle,
} from "lucide-react";

type Props = { editor: Editor };

function ToolbarButton({
  onClick,
  active,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`focus-ring border p-2 transition ${
        active ? "border-white/40 text-white" : "border-white/10 text-white/60 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

export default function Toolbar({ editor }: Props) {
  function promptLink() {
    const url = window.prompt("Link URL:", editor.getAttributes("link").href ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url }).run();
  }

  function promptImage() {
    const url = window.prompt("Image URL:");
    if (!url) return;
    const alt = window.prompt("Alt text:") ?? "";
    editor.chain().focus().setImage({ src: url, alt }).run();
  }

  function promptVideo() {
    const url = window.prompt("YouTube video URL:");
    if (!url) return;
    editor.commands.setYoutubeVideo({ src: url });
  }

  function promptButton() {
    const label = window.prompt("Button label:", "Learn more");
    if (!label) return;
    const href = window.prompt("Button link URL:", "https://");
    if (!href) return;
    editor.commands.insertCtaButton({ label, href });
  }

  return (
    <div className="flex flex-wrap gap-1 border border-b-0 border-white/15 bg-white/5 p-2">
      <select
        aria-label="Text style"
        className="focus-ring border border-white/10 bg-transparent px-2 py-1 text-xs text-white/70"
        value={
          editor.isActive("heading", { level: 1 })
            ? "1"
            : editor.isActive("heading", { level: 2 })
              ? "2"
              : editor.isActive("heading", { level: 3 })
                ? "3"
                : editor.isActive("heading", { level: 4 })
                  ? "4"
                  : editor.isActive("heading", { level: 5 })
                    ? "5"
                    : editor.isActive("heading", { level: 6 })
                      ? "6"
                      : "0"
        }
        onChange={(e) => {
          const level = Number(e.target.value);
          if (level === 0) editor.chain().focus().setParagraph().run();
          else
            editor
              .chain()
              .focus()
              .setHeading({ level: level as 1 | 2 | 3 | 4 | 5 | 6 })
              .run();
        }}
      >
        <option value="0">Paragraph</option>
        {[1, 2, 3, 4, 5, 6].map((l) => (
          <option key={l} value={l}>
            Heading {l}
          </option>
        ))}
      </select>

      <ToolbarButton
        label="Bold"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold size={14} />
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic size={14} />
      </ToolbarButton>
      <ToolbarButton
        label="Underline"
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon size={14} />
      </ToolbarButton>
      <ToolbarButton
        label="Bullet list"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List size={14} />
      </ToolbarButton>
      <ToolbarButton
        label="Numbered list"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered size={14} />
      </ToolbarButton>
      <ToolbarButton
        label="Quote"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote size={14} />
      </ToolbarButton>
      <ToolbarButton label="Link" active={editor.isActive("link")} onClick={promptLink}>
        <LinkIcon size={14} />
      </ToolbarButton>
      <ToolbarButton
        label="Table"
        onClick={() =>
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }
      >
        <TableIcon size={14} />
      </ToolbarButton>
      <ToolbarButton label="Image" onClick={promptImage}>
        <ImageIcon size={14} />
      </ToolbarButton>
      <ToolbarButton label="Image gallery" onClick={() => editor.commands.insertGallery()}>
        <Images size={14} />
      </ToolbarButton>
      <ToolbarButton label="YouTube video" onClick={promptVideo}>
        <YoutubeIcon size={14} />
      </ToolbarButton>
      <ToolbarButton
        label="Code block"
        active={editor.isActive("codeBlock")}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        <Code size={14} />
      </ToolbarButton>
      <ToolbarButton
        label="Divider"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <Minus size={14} />
      </ToolbarButton>
      <ToolbarButton label="CTA button" onClick={promptButton}>
        <MousePointerClick size={14} />
      </ToolbarButton>
      <ToolbarButton label="Info callout" onClick={() => editor.commands.setCallout("info")}>
        <Info size={14} />
      </ToolbarButton>
      <ToolbarButton label="Tip callout" onClick={() => editor.commands.setCallout("tip")}>
        <Lightbulb size={14} />
      </ToolbarButton>
      <ToolbarButton label="Warning callout" onClick={() => editor.commands.setCallout("warning")}>
        <AlertTriangle size={14} />
      </ToolbarButton>
      <ToolbarButton label="Undo" onClick={() => editor.chain().focus().undo().run()}>
        <Undo size={14} />
      </ToolbarButton>
      <ToolbarButton label="Redo" onClick={() => editor.chain().focus().redo().run()}>
        <Redo size={14} />
      </ToolbarButton>
    </div>
  );
}
