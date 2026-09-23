import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import {
  listAllArticlesAdmin,
  listAllCategories,
  getDashboardStats,
  type AdminArticleFilters,
} from "@/lib/journal/repository";
import Card from "@/components/ui/Card";
import LinkButton from "@/components/ui/LinkButton";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import {
  deleteArticleAction,
  duplicateArticleAction,
  archiveArticleAction,
  restoreToDraftAction,
} from "./actions";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

// A PUBLISHED row with a future publishedAt is "scheduled" (see the Article
// model's doc comment) — not a component, so calling Date.now() here doesn't
// trip the react-hooks purity rule the way doing it inline in the page
// component's body would.
function isScheduled(article: { status: string; publishedAt: Date | null }): boolean {
  return (
    article.status === "PUBLISHED" &&
    !!article.publishedAt &&
    article.publishedAt.getTime() > Date.now()
  );
}

export default async function JournalAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string; q?: string }>;
}) {
  await requireRole(["OWNER", "ADMIN"]);
  const params = await searchParams;

  const filters: AdminArticleFilters = {
    status: params.status as AdminArticleFilters["status"],
    categoryId: params.category || undefined,
    search: params.q || undefined,
  };

  const [articles, categories, stats] = await Promise.all([
    listAllArticlesAdmin(filters),
    listAllCategories(),
    getDashboardStats(),
  ]);

  return (
    <div className="max-w-5xl">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-2xl font-light">Journal</h1>
          <p className="text-sm text-muted">Studio news, updates, and editorial content.</p>
        </div>
        <LinkButton href="/admin/journal/new">New article</LinkButton>
      </div>

      <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <p className="text-2xl font-light">{stats.total}</p>
          <p className="tracked-label mt-1 text-muted">Total</p>
        </Card>
        <Card>
          <p className="text-2xl font-light">{stats.draft}</p>
          <p className="tracked-label mt-1 text-muted">Drafts</p>
        </Card>
        <Card>
          <p className="text-2xl font-light">{stats.published}</p>
          <p className="tracked-label mt-1 text-muted">Published</p>
        </Card>
        <Card>
          <p className="text-2xl font-light">{stats.scheduled}</p>
          <p className="tracked-label mt-1 text-muted">Scheduled</p>
        </Card>
      </div>

      <div className="mb-10 grid gap-4 sm:grid-cols-2">
        <Card>
          <p className="tracked-label mb-3 text-muted">
            Most viewed ({stats.totalViews} total views)
          </p>
          {stats.mostViewed.length === 0 ? (
            <p className="text-sm text-muted">No views yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {stats.mostViewed.map((a) => (
                <li key={a.id} className="flex items-center justify-between text-sm">
                  <Link
                    href={`/admin/journal/${a.id}/edit`}
                    className="focus-ring hover:text-white/70"
                  >
                    {a.title}
                  </Link>
                  <span className="text-muted">{a.viewCount}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <p className="tracked-label mb-3 text-muted">Top categories</p>
          {stats.topCategories.length === 0 ? (
            <p className="text-sm text-muted">No categories yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {stats.topCategories.map((c) => (
                <li key={c.slug} className="flex items-center justify-between text-sm">
                  <span>{c.name}</span>
                  <span className="text-muted">{c._count.articles}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <form className="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="filter-status" className="text-xs text-muted">
            Status
          </label>
          <Select
            id="filter-status"
            name="status"
            defaultValue={params.status ?? ""}
            className="mt-1"
          >
            <option value="">All</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </Select>
        </div>
        <div>
          <label htmlFor="filter-category" className="text-xs text-muted">
            Category
          </label>
          <Select
            id="filter-category"
            name="category"
            defaultValue={params.category ?? ""}
            className="mt-1"
          >
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id} className="bg-black">
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex-1">
          <label htmlFor="filter-q" className="text-xs text-muted">
            Search
          </label>
          <Input id="filter-q" name="q" defaultValue={params.q ?? ""} className="mt-1 w-full" />
        </div>
        <Button type="submit" className="px-4 py-2">
          Filter
        </Button>
      </form>

      {articles.length === 0 ? (
        <p className="text-sm text-muted">No articles match these filters.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {articles.map((article) => {
            return (
              <Card as="li" key={article.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm">
                      {article.title}{" "}
                      <span className="tracked-label ml-2 text-muted">
                        {isScheduled(article) ? "Scheduled" : STATUS_LABEL[article.status]}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {article.category?.name ?? "Uncategorized"} · {article.viewCount} views ·
                      updated {article.updatedAt.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 flex-wrap items-center gap-3">
                    <Link
                      href={`/admin/journal/${article.id}/preview`}
                      className="focus-ring tracked-label text-white/70 transition hover:text-white"
                    >
                      Preview
                    </Link>
                    <Link
                      href={`/admin/journal/${article.id}/edit`}
                      className="focus-ring tracked-label text-white/70 transition hover:text-white"
                    >
                      Edit
                    </Link>
                    <form action={duplicateArticleAction.bind(null, article.id)}>
                      <button
                        type="submit"
                        className="focus-ring tracked-label text-white/70 transition hover:text-white"
                      >
                        Duplicate
                      </button>
                    </form>
                    {article.status === "ARCHIVED" ? (
                      <form action={restoreToDraftAction.bind(null, article.id)}>
                        <button
                          type="submit"
                          className="focus-ring tracked-label text-white/70 transition hover:text-white"
                        >
                          Restore
                        </button>
                      </form>
                    ) : (
                      <form action={archiveArticleAction.bind(null, article.id)}>
                        <button
                          type="submit"
                          className="focus-ring tracked-label text-white/70 transition hover:text-white"
                        >
                          Archive
                        </button>
                      </form>
                    )}
                    <ConfirmSubmitButton
                      action={deleteArticleAction.bind(null, article.id)}
                      triggerLabel="Delete"
                      triggerClassName="focus-ring tracked-label text-white/70 transition hover:text-white"
                      title="Delete this article?"
                      message={`This will permanently delete "${article.title}".`}
                      confirmLabel="Delete article"
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </ul>
      )}
    </div>
  );
}
