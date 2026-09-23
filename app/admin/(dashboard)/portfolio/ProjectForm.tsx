"use client";

import { useActionState, useState } from "react";
import { Plus, X } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import FormError from "@/components/ui/FormError";
import ToolIcon from "@/components/ToolIcon";
import { TOOL_IDS, TOOL_LABELS, isToolId } from "@/lib/portfolio/tools";
import type { ActionState } from "./actions";

const labelClass = "text-xs text-muted";

type Download = { url: string; label: string };

type Project = {
  slug: string;
  title: string;
  category: string;
  description: string | null;
  group: "PERSONAL" | "COMMISSIONED";
  accent: string;
  imageUrl: string | null;
  images: unknown;
  videoUrl: string | null;
  modelUrl: string | null;
  modelTint: string | null;
  downloads: unknown;
  tools: unknown;
  order: number;
  isActive: boolean;
};

type Props = {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  project?: Project;
  submitLabel: string;
};

export default function ProjectForm({ action, project, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, null);

  const [images, setImages] = useState<string[]>(
    Array.isArray(project?.images) && project.images.length > 0
      ? (project.images as string[])
      : [""]
  );
  const [downloads, setDownloads] = useState<Download[]>(
    Array.isArray(project?.downloads) && project.downloads.length > 0
      ? (project.downloads as Download[])
      : [{ url: "", label: "" }]
  );
  const [tools, setTools] = useState<string[]>(
    Array.isArray(project?.tools)
      ? project.tools.filter((t): t is string => typeof t === "string" && isToolId(t))
      : []
  );

  const cleanImages = images.filter((url) => url.trim() !== "");
  const cleanDownloads = downloads.filter((d) => d.url.trim() !== "" && d.label.trim() !== "");

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4">
      <input type="hidden" name="images" readOnly value={JSON.stringify(cleanImages)} />
      <input type="hidden" name="downloads" readOnly value={JSON.stringify(cleanDownloads)} />
      <input type="hidden" name="tools" readOnly value={JSON.stringify(tools)} />

      <label htmlFor="project-slug" className={labelClass}>
        Slug (URL — lowercase, hyphens only)
      </label>
      <Input
        id="project-slug"
        type="text"
        name="slug"
        required
        pattern="[a-z0-9-]+"
        defaultValue={project?.slug}
      />

      <label htmlFor="project-title" className={labelClass}>
        Title
      </label>
      <Input id="project-title" type="text" name="title" required defaultValue={project?.title} />

      <label htmlFor="project-category" className={labelClass}>
        Category
      </label>
      <Input
        id="project-category"
        type="text"
        name="category"
        required
        placeholder="e.g. 3D Fashion"
        defaultValue={project?.category}
      />

      <label htmlFor="project-description" className={labelClass}>
        Description (optional — short blurb shown on the detail page, e.g. what deliverables were
        made)
      </label>
      <Textarea
        id="project-description"
        name="description"
        rows={3}
        placeholder="An animation, renders, and technical drawings were created for this project."
        defaultValue={project?.description ?? ""}
      />

      <label htmlFor="project-group" className={labelClass}>
        Group
      </label>
      <Select id="project-group" name="group" defaultValue={project?.group ?? "PERSONAL"}>
        <option value="PERSONAL" className="bg-black">
          Personal Projects
        </option>
        <option value="COMMISSIONED" className="bg-black">
          Studio Projects
        </option>
      </Select>

      <label htmlFor="project-accent" className={labelClass}>
        Accent color (hex, used behind the image/gradient)
      </label>
      <Input
        id="project-accent"
        type="text"
        name="accent"
        required
        placeholder="#202426"
        defaultValue={project?.accent ?? "#202426"}
        className="w-32"
      />

      <label htmlFor="project-image" className={labelClass}>
        Card image URL (optional — falls back to the accent gradient; also the first image on the
        project&apos;s detail page)
      </label>
      <Input id="project-image" type="url" name="imageUrl" defaultValue={project?.imageUrl ?? ""} />

      <div className="flex flex-col gap-2">
        <span className={labelClass}>Additional gallery images (detail page only)</span>
        {images.map((url, index) => (
          <div key={index} className="flex gap-2">
            <Input
              type="url"
              value={url}
              placeholder="https://res.cloudinary.com/..."
              onChange={(e) =>
                setImages((current) => current.map((u, i) => (i === index ? e.target.value : u)))
              }
              className="flex-1"
            />
            <button
              type="button"
              aria-label="Remove image"
              onClick={() => setImages((current) => current.filter((_, i) => i !== index))}
              className="focus-ring border border-white/15 px-2 text-white/50 transition hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setImages((current) => [...current, ""])}
          className="focus-ring tracked-label flex w-fit items-center gap-1 text-white/60 transition hover:text-white"
        >
          <Plus size={12} /> Add image
        </button>
      </div>

      <label htmlFor="project-video" className={labelClass}>
        Video URL (optional — shown on the detail page)
      </label>
      <Input id="project-video" type="url" name="videoUrl" defaultValue={project?.videoUrl ?? ""} />

      <label htmlFor="project-model" className={labelClass}>
        3D model URL (optional — a .glb shown as an interactive viewer on the detail page)
      </label>
      <Input
        id="project-model"
        type="text"
        name="modelUrl"
        defaultValue={project?.modelUrl ?? ""}
      />

      <label htmlFor="project-model-tint" className={labelClass}>
        3D model color override (optional — hex; use when the .glb has no colors baked in)
      </label>
      <Input
        id="project-model-tint"
        type="text"
        name="modelTint"
        placeholder="#366cfa"
        defaultValue={project?.modelTint ?? ""}
        className="w-32"
      />

      <div className="flex flex-col gap-2">
        <span className={labelClass}>
          Tools used (optional — shown as small icon badges on the detail page)
        </span>
        <div className="flex flex-wrap gap-3">
          {TOOL_IDS.map((tool) => {
            const checked = tools.includes(tool);
            return (
              <label
                key={tool}
                className={`focus-within:ring-2 flex cursor-pointer flex-col items-center gap-1 border px-2 py-2 text-xs transition ${
                  checked ? "border-white" : "border-white/15 hover:border-white/40"
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={checked}
                  onChange={(e) =>
                    setTools((current) =>
                      e.target.checked ? [...current, tool] : current.filter((t) => t !== tool)
                    )
                  }
                />
                <ToolIcon tool={tool} size={28} />
                <span className="text-white/70">{TOOL_LABELS[tool]}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className={labelClass}>
          Downloadable files (optional — source files, technical drawings, etc.)
        </span>
        {downloads.map((download, index) => (
          <div key={index} className="flex gap-2">
            <Input
              type="url"
              value={download.url}
              placeholder="https://res.cloudinary.com/..."
              onChange={(e) =>
                setDownloads((current) =>
                  current.map((d, i) => (i === index ? { ...d, url: e.target.value } : d))
                )
              }
              className="flex-1"
            />
            <Input
              type="text"
              value={download.label}
              placeholder="Download source file (.zprj, 7.8MB)"
              onChange={(e) =>
                setDownloads((current) =>
                  current.map((d, i) => (i === index ? { ...d, label: e.target.value } : d))
                )
              }
              className="flex-1"
            />
            <button
              type="button"
              aria-label="Remove download"
              onClick={() => setDownloads((current) => current.filter((_, i) => i !== index))}
              className="focus-ring border border-white/15 px-2 text-white/50 transition hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setDownloads((current) => [...current, { url: "", label: "" }])}
          className="focus-ring tracked-label flex w-fit items-center gap-1 text-white/60 transition hover:text-white"
        >
          <Plus size={12} /> Add download
        </button>
      </div>

      <label htmlFor="project-order" className={labelClass}>
        Order (lower shows first)
      </label>
      <Input
        id="project-order"
        type="number"
        name="order"
        min={0}
        step={1}
        defaultValue={project?.order ?? 0}
        className="w-24"
      />

      {project && (
        <label className="flex items-center gap-2 text-sm text-white/70">
          <input type="checkbox" name="isActive" defaultChecked={project.isActive} />
          Active (visible on the portfolio page)
        </label>
      )}

      <FormError error={state?.error} />

      <Button
        type="submit"
        pending={pending}
        pendingLabel="Saving…"
        className="mt-2 w-fit px-6 py-3"
      >
        {submitLabel}
      </Button>
    </form>
  );
}
