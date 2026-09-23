import { requireRole } from "@/lib/auth/session";
import { listAllCategories, listAllTags } from "@/lib/journal/repository";
import ArticleForm from "../ArticleForm";
import { createArticleAction } from "../actions";

export default async function NewArticlePage() {
  await requireRole(["OWNER", "ADMIN"]);
  const [categories, tags] = await Promise.all([listAllCategories(), listAllTags()]);

  return (
    <div>
      <h1 className="mb-8 text-2xl font-light">New article</h1>
      <ArticleForm
        action={createArticleAction}
        categories={categories}
        tagSuggestions={tags.map((t) => t.name)}
      />
    </div>
  );
}
