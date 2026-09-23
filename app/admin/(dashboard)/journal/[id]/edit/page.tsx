import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { findArticleById, listAllCategories, listAllTags } from "@/lib/journal/repository";
import ArticleForm from "../../ArticleForm";
import { updateArticleAction } from "../../actions";

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["OWNER", "ADMIN"]);
  const { id } = await params;

  const [article, categories, tags] = await Promise.all([
    findArticleById(id),
    listAllCategories(),
    listAllTags(),
  ]);
  if (!article) notFound();

  return (
    <div>
      <h1 className="mb-8 text-2xl font-light">Edit article</h1>
      <ArticleForm
        action={updateArticleAction.bind(null, id)}
        article={article}
        categories={categories}
        tagSuggestions={tags.map((t) => t.name)}
      />
    </div>
  );
}
