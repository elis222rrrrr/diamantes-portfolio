"use client";

import { useActionState, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import FormError from "@/components/ui/FormError";
import FeaturedImageEditor from "@/components/journal/FeaturedImageEditor";
import TagInput from "@/components/journal/TagInput";
import { slugify } from "@/lib/journal/slugify";
import type { ActionState } from "./actions";

// The Tiptap editor touches `window`/`document` at module load — loading it
// only on the client avoids a server-render mismatch, and it's only ever
// needed on this admin form, not on any page that has to be fast for a
// visitor.
const RichTextEditor = dynamic(() => import("@/components/journal/editor/RichTextEditor"), {
  ssr: false,
  loading: () => <div className="min-h-[400px] border border-white/15 bg-white/5" />,
});

const labelClass = "text-xs text-muted";

type Category = { id: string; name: string };

type Article = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  content: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishedAt: Date | null;
  featuredImageUrl: string | null;
  featuredImageAlt: string | null;
  featuredImageCaption: string | null;
  authorName: string | null;
  categoryId: string | null;
  tags: { name: string }[];
  seoTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  ogImageUrl: string | null;
  focusKeyword: string | null;
};

type Props = {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  article?: Article;
  categories: Category[];
  tagSuggestions: string[];
};

function toDatetimeLocal(date: Date | null): string {
  if (!date) return "";
  const d = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return d.toISOString().slice(0, 16);
}

export default function ArticleForm({ action, article, categories, tagSuggestions }: Props) {
  const [state, formAction, pending] = useActionState(action, null);

  const [title, setTitle] = useState(article?.title ?? "");
  const [slug, setSlug] = useState(article?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!article);
  const [content, setContent] = useState(article?.content ?? "");
  const [publishedAt, setPublishedAt] = useState(toDatetimeLocal(article?.publishedAt ?? null));

  const isScheduled = publishedAt && new Date(publishedAt) > new Date();

  return (
    <form action={formAction} className="flex max-w-3xl flex-col gap-6">
      <input type="hidden" name="content" value={content} readOnly />
      {article && article.status === "ARCHIVED" && (
        <p className="text-xs text-muted">
          This article is currently archived — saving as draft or publishing will move it out of the
          archive.
        </p>
      )}

      <div>
        <label htmlFor="article-title" className={labelClass}>
          Title
        </label>
        <Input
          id="article-title"
          name="title"
          required
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
          className="mt-1 w-full"
          size="md"
        />
      </div>

      <div>
        <label htmlFor="article-slug" className={labelClass}>
          Slug — /journal/{slug || "…"}
        </label>
        <Input
          id="article-slug"
          name="slug"
          required
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
          className="mt-1 w-full"
        />
      </div>

      <div>
        <label htmlFor="article-subtitle" className={labelClass}>
          Subtitle (optional)
        </label>
        <Input
          id="article-subtitle"
          name="subtitle"
          defaultValue={article?.subtitle ?? ""}
          className="mt-1 w-full"
        />
      </div>

      <FeaturedImageEditor
        initialUrl={article?.featuredImageUrl}
        initialAlt={article?.featuredImageAlt}
        initialCaption={article?.featuredImageCaption}
      />

      <div>
        <label htmlFor="article-excerpt" className={labelClass}>
          Excerpt (optional — auto-generated from the article body if left blank)
        </label>
        <Textarea
          id="article-excerpt"
          name="excerpt"
          rows={2}
          defaultValue={article?.excerpt ?? ""}
          className="mt-1 w-full"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="article-author" className={labelClass}>
            Author (optional)
          </label>
          <Input
            id="article-author"
            name="authorName"
            defaultValue={article?.authorName ?? ""}
            className="mt-1 w-full"
          />
        </div>
        <div>
          <label htmlFor="article-category" className={labelClass}>
            Category
          </label>
          <Select
            id="article-category"
            name="categoryId"
            defaultValue={article?.categoryId ?? ""}
            className="mt-1 w-full"
          >
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id} className="bg-black">
                {c.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <span className={labelClass}>Tags</span>
        <div className="mt-1">
          <TagInput
            name="tagNames"
            initialTags={article?.tags.map((t) => t.name) ?? []}
            suggestions={tagSuggestions}
          />
        </div>
      </div>

      <div>
        <span className={labelClass}>Content</span>
        <div className="mt-1">
          <RichTextEditor content={content} onChange={setContent} />
        </div>
      </div>

      <fieldset className="border border-white/10 p-4">
        <legend className="tracked-label px-2 text-muted">SEO</legend>
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="seo-title" className={labelClass}>
              SEO title (falls back to the article title)
            </label>
            <Input
              id="seo-title"
              name="seoTitle"
              defaultValue={article?.seoTitle ?? ""}
              className="mt-1 w-full"
            />
          </div>
          <div>
            <label htmlFor="seo-description" className={labelClass}>
              Meta description (falls back to the excerpt)
            </label>
            <Textarea
              id="seo-description"
              name="metaDescription"
              rows={2}
              defaultValue={article?.metaDescription ?? ""}
              className="mt-1 w-full"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="canonical-url" className={labelClass}>
                Canonical URL (optional)
              </label>
              <Input
                id="canonical-url"
                name="canonicalUrl"
                defaultValue={article?.canonicalUrl ?? ""}
                className="mt-1 w-full"
              />
            </div>
            <div>
              <label htmlFor="og-image" className={labelClass}>
                Open Graph image URL (falls back to the featured image)
              </label>
              <Input
                id="og-image"
                name="ogImageUrl"
                defaultValue={article?.ogImageUrl ?? ""}
                className="mt-1 w-full"
              />
            </div>
          </div>
          <div>
            <label htmlFor="focus-keyword" className={labelClass}>
              Focus keyword (optional)
            </label>
            <Input
              id="focus-keyword"
              name="focusKeyword"
              defaultValue={article?.focusKeyword ?? ""}
              className="mt-1 w-full"
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="border border-white/10 p-4">
        <legend className="tracked-label px-2 text-muted">Publish</legend>
        <div>
          <label htmlFor="publish-at" className={labelClass}>
            Publish date &amp; time (leave blank to publish immediately)
          </label>
          <input
            id="publish-at"
            name="publishedAt"
            type="datetime-local"
            value={publishedAt}
            onChange={(e) => setPublishedAt(e.target.value)}
            className="focus-ring mt-1 border border-white/15 bg-transparent px-3 py-2 text-sm"
          />
        </div>
      </fieldset>

      <FormError error={state?.error} />

      <div className="flex flex-wrap items-center gap-3">
        {/* Which button was actually clicked is what decides the saved status —
            read server-side via formData.get("intent"). This can't be a React
            state + hidden-input value instead: the browser snapshots FormData
            for submission synchronously on click, before a state-driven re-render
            of a hidden input's value could ever land. */}
        <Button
          type="submit"
          name="intent"
          value="draft"
          pending={pending}
          className="w-fit px-6 py-3"
        >
          Save as draft
        </Button>
        <Button
          type="submit"
          name="intent"
          value="publish"
          pending={pending}
          className="w-fit px-6 py-3"
        >
          {isScheduled ? `Schedule for ${new Date(publishedAt).toLocaleString()}` : "Publish now"}
        </Button>
        <Link href="/admin/journal" className="focus-ring text-sm text-white/60 hover:text-white">
          Cancel
        </Link>
      </div>
    </form>
  );
}
