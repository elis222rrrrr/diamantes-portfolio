import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { findArticleById } from "@/lib/journal/repository";
import ArticleContent from "@/components/journal/ArticleContent";

export default async function ArticlePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["OWNER", "ADMIN"]);
  const { id } = await params;

  const article = await findArticleById(id);
  if (!article) notFound();

  return (
    <div className="text-white">
      <div className="mb-8 flex items-center justify-between border border-yellow-500/30 bg-yellow-500/5 p-4 text-sm text-yellow-200">
        <span>
          Preview only — this shows exactly what the public page will render, regardless of the
          article&apos;s current status.
        </span>
        <Link href={`/admin/journal/${id}/edit`} className="focus-ring underline hover:text-white">
          Back to edit
        </Link>
      </div>
      <ArticleContent article={article} />
    </div>
  );
}
