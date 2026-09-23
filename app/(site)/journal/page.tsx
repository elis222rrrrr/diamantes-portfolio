import Link from "next/link";
import {
  listPublishedArticles,
  listPublicCategories,
  listPublicTags,
} from "@/lib/journal/repository";
import { buildMetadata } from "@/lib/seo/metadata";
import ArticleCard from "@/components/journal/ArticleCard";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

export const metadata = buildMetadata({
  title: "Journal",
  description: "News, updates, projects, and behind-the-scenes from Diamantes 3Designs.",
  path: "/journal",
});

export const dynamic = "force-dynamic";

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    tag?: string;
    q?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const sort = params.sort === "oldest" ? "oldest" : "newest";
  const page = Math.max(1, Number(params.page) || 1);

  const [{ articles, totalPages }, categories, tags] = await Promise.all([
    listPublishedArticles({
      categorySlug: params.category,
      tagSlug: params.tag,
      search: params.q,
      sort,
      page,
    }),
    listPublicCategories(),
    listPublicTags(),
  ]);

  function pageHref(overrides: Record<string, string | undefined>) {
    const next = new URLSearchParams();
    const merged = {
      category: params.category,
      tag: params.tag,
      q: params.q,
      sort: params.sort,
      ...overrides,
    };
    for (const [key, value] of Object.entries(merged)) {
      if (value) next.set(key, value);
    }
    const qs = next.toString();
    return qs ? `/journal?${qs}` : "/journal";
  }

  return (
    <section className="section-container flex-1 text-white">
      <p className="tracked-label mb-3 text-muted">Studio news &amp; updates</p>
      <div className="mb-3 h-px w-6" style={{ backgroundColor: "var(--focus-ring)" }} />
      <h1 className="section-heading mb-10">Journal</h1>

      {/* One continuous dashed-frame bar (same "selected object" bracket
          language as the Hero's own EXPLORE button — dashed border + solid
          corner squares) instead of separate rounded pills. Fields are
          divided by "cuts" (dashed dividers) rather than gaps, and each
          Input/Select's own default border is force-removed (!border-none
          — a plain border-none loses to the component's own `border`
          class at equal specificity, same reason !px-4 was needed
          elsewhere) since the outer bar now supplies the one border. */}
      <div
        className="relative mb-10 flex flex-wrap items-stretch border border-dashed"
        style={{ borderColor: "color-mix(in srgb, var(--foreground) 50%, transparent)" }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -left-[3px] -top-[3px] h-1.5 w-1.5"
          style={{ background: "var(--foreground)" }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -right-[3px] -top-[3px] h-1.5 w-1.5"
          style={{ background: "var(--foreground)" }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-[3px] -left-[3px] h-1.5 w-1.5"
          style={{ background: "var(--foreground)" }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-[3px] -right-[3px] h-1.5 w-1.5"
          style={{ background: "var(--foreground)" }}
        />

        <form className="flex w-full flex-wrap items-stretch">
          <div
            className="flex flex-1 flex-col gap-1 border-r border-dashed px-4 py-3"
            style={{ borderColor: "color-mix(in srgb, var(--foreground) 30%, transparent)" }}
          >
            <label htmlFor="journal-search" className="text-xs text-muted">
              Search
            </label>
            <Input
              id="journal-search"
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Search articles…"
              className="!border-none !bg-transparent !px-0 w-full"
            />
          </div>
          <div
            className="flex flex-col gap-1 border-r border-dashed px-4 py-3 sm:w-44"
            style={{ borderColor: "color-mix(in srgb, var(--foreground) 30%, transparent)" }}
          >
            <label htmlFor="journal-category" className="text-xs text-muted">
              Category
            </label>
            <Select
              id="journal-category"
              name="category"
              defaultValue={params.category ?? ""}
              className="!border-none !bg-transparent !px-0 w-full"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug} className="bg-black">
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div
            className="flex flex-col gap-1 border-r border-dashed px-4 py-3 sm:w-44"
            style={{ borderColor: "color-mix(in srgb, var(--foreground) 30%, transparent)" }}
          >
            <label htmlFor="journal-tag" className="text-xs text-muted">
              Tag
            </label>
            <Select
              id="journal-tag"
              name="tag"
              defaultValue={params.tag ?? ""}
              className="!border-none !bg-transparent !px-0 w-full"
            >
              <option value="">All tags</option>
              {tags.map((t) => (
                <option key={t.id} value={t.slug} className="bg-black">
                  {t.name}
                </option>
              ))}
            </Select>
          </div>
          <div
            className="flex flex-col gap-1 border-r border-dashed px-4 py-3 sm:w-44"
            style={{ borderColor: "color-mix(in srgb, var(--foreground) 30%, transparent)" }}
          >
            <label htmlFor="journal-sort" className="text-xs text-muted">
              Sort
            </label>
            <Select
              id="journal-sort"
              name="sort"
              defaultValue={sort}
              className="!border-none !bg-transparent !px-0 w-full"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </Select>
          </div>
          <Button type="submit" className="!border-none px-6 py-3">
            Apply
          </Button>
        </form>
      </div>

      {articles.length === 0 ? (
        <p className="text-sm text-muted">No articles match these filters.</p>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-4">
              {page > 1 && (
                <Link
                  href={pageHref({ page: String(page - 1) })}
                  className="focus-ring tracked-label text-white/70 hover:text-white"
                >
                  ← Newer
                </Link>
              )}
              <span className="text-xs text-muted">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={pageHref({ page: String(page + 1) })}
                  className="focus-ring tracked-label text-white/70 hover:text-white"
                >
                  Older →
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
