import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  findPublishedArticleBySlug,
  incrementViewCount,
  getRelatedArticles,
  getAdjacentArticles,
  getLatestArticles,
} from "@/lib/journal/repository";
import { getExcerpt } from "@/lib/journal/excerpt";
import { SITE_URL } from "@/lib/seo/site";
import { safeJsonLd } from "@/lib/seo/json-ld";
import ArticleContent from "@/components/journal/ArticleContent";
import ArticleCard from "@/components/journal/ArticleCard";
import ShareButtons from "@/components/journal/ShareButtons";
import ReadingProgressBar from "@/components/journal/ReadingProgressBar";

export const dynamic = "force-dynamic";

async function loadArticle(slug: string) {
  const article = await findPublishedArticleBySlug(slug);
  if (!article) notFound();
  return article;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await findPublishedArticleBySlug(slug);
  if (!article) return {};

  const title = article.seoTitle || article.title;
  const description = article.metaDescription || getExcerpt(article.content, article.excerpt);
  const url = article.canonicalUrl || `${SITE_URL}/journal/${article.slug}`;
  const ogImage = article.ogImageUrl || article.featuredImageUrl;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "Diamantes 3Designs",
      type: "article",
      locale: "en_US",
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
      publishedTime: article.publishedAt?.toISOString(),
      modifiedTime: article.updatedAt.toISOString(),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await loadArticle(slug);

  // Fire-and-forget — a view count that's occasionally off by one under
  // concurrent hits isn't worth blocking the page render for.
  incrementViewCount(article.id).catch(() => {});

  const [related, { prev, next }, latest] = await Promise.all([
    getRelatedArticles(article, 3),
    getAdjacentArticles(article),
    getLatestArticles(4, article.id),
  ]);

  const url = `${SITE_URL}/journal/${article.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.metaDescription || getExcerpt(article.content, article.excerpt),
    image: article.featuredImageUrl ? [article.featuredImageUrl] : undefined,
    datePublished: article.publishedAt?.toISOString(),
    dateModified: article.updatedAt.toISOString(),
    author: article.authorName ? { "@type": "Person", name: article.authorName } : undefined,
    publisher: { "@type": "Organization", name: "Diamantes 3Designs" },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <ReadingProgressBar />

      <section className="section-container flex-1 text-white">
        <Link
          href="/journal"
          className="focus-ring tracked-label mb-8 inline-block text-muted hover:text-white"
        >
          ← Back to Journal
        </Link>

        <ArticleContent article={article} />

        <div className="mx-auto mt-10 max-w-2xl">
          <ShareButtons title={article.title} url={url} />
        </div>

        <div className="mx-auto mt-10 flex max-w-2xl items-center justify-between border-t border-white/10 pt-6 text-sm">
          {prev ? (
            <Link
              href={`/journal/${prev.slug}`}
              className="focus-ring text-white/70 hover:text-white"
            >
              ← {prev.title}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={`/journal/${next.slug}`}
              className="focus-ring text-right text-white/70 hover:text-white"
            >
              {next.title} →
            </Link>
          ) : (
            <span />
          )}
        </div>

        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="tracked-label mb-6 text-muted">Related articles</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((a) => (
                <ArticleCard key={a.slug} article={a} />
              ))}
            </div>
          </div>
        )}

        {latest.length > 0 && (
          <div className="mt-16">
            <h2 className="tracked-label mb-6 text-muted">Latest articles</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {latest.map((a) => (
                <ArticleCard key={a.slug} article={a} />
              ))}
            </div>
          </div>
        )}
      </section>
    </>
  );
}
