import Image from "next/image";
import Link from "next/link";
import { formatReadingTime } from "@/lib/journal/reading-time";
import type { Article, JournalCategory, JournalTag } from "@prisma/client";

type ArticleWithRelations = Article & {
  category: JournalCategory | null;
  tags: JournalTag[];
};

function formatDate(date: Date | null): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/** The full article body — hero, title/meta, sanitized content, tags.
 * Shared by the public `/journal/[slug]` page and the admin preview page, so
 * "preview before publishing" shows exactly what a visitor would see. */
export default function ArticleContent({ article }: { article: ArticleWithRelations }) {
  const updatedMeaningfully =
    article.updatedAt.getTime() - (article.publishedAt?.getTime() ?? 0) > 60_000;

  return (
    <article>
      {article.featuredImageUrl && (
        <div
          className={
            // A local site asset (e.g. "/logo-mark.png") is a mark/logo, not
            // a photo — plain black, no bg-white/5 tint, per feedback.
            // bg-[#000000] (literal), not bg-black: this site's bg-black is
            // a semantic theme token that resolves to WHITE under the light
            // theme (see CutWord.tsx's identical note) — with the logo
            // mark itself rendering solid white, bg-black here would have
            // made it invisible (white on white) for any visitor in light
            // mode, which is exactly what happened.
            article.featuredImageUrl.startsWith("/")
              ? "relative mb-8 aspect-[21/9] w-full overflow-hidden bg-[#000000]"
              : "relative mb-8 aspect-[21/9] w-full overflow-hidden bg-white/5"
          }
        >
          <Image
            src={article.featuredImageUrl}
            alt={article.featuredImageAlt ?? article.title}
            fill
            priority
            className={
              // A local site asset (e.g. "/logo-mark.png") is a mark/logo,
              // not a photo shot to fit this 21:9 banner — object-cover
              // would crop a tall, narrow mark into an unrecognizable
              // sliver. An uploaded Cloudinary photo (an absolute URL) is
              // shot for this frame, so cover is the right fit there. Some
              // padding (per feedback) keeps the mark from stretching to
              // fill this wide, short banner — but not too much: this is
              // the same fine, thin-lined ornamental mark that was already
              // illegible once before at a too-small render size (the nav
              // logo, see components/Nav.tsx's own h-20 fix), so shrinking
              // it further than this makes it read as nothing at all.
              article.featuredImageUrl.startsWith("/")
                ? "object-contain p-10 sm:p-16"
                : "object-cover"
            }
            sizes="100vw"
          />
        </div>
      )}
      {article.featuredImageCaption && (
        <p className="mb-8 text-xs text-muted">{article.featuredImageCaption}</p>
      )}

      <div className="mx-auto max-w-2xl">
        {article.category && (
          <Link
            href={`/journal?category=${article.category.slug}`}
            className="focus-ring tracked-label mb-4 inline-block text-muted hover:text-white"
          >
            {article.category.name}
          </Link>
        )}

        <h1 className="mb-4 text-4xl font-light leading-tight text-white">{article.title}</h1>
        {article.subtitle && <p className="mb-6 text-lg text-white/60">{article.subtitle}</p>}

        <div className="mb-10 flex flex-wrap items-center gap-3 text-xs text-muted">
          {article.authorName && <span>{article.authorName}</span>}
          {article.authorName && <span>·</span>}
          <span>{formatDate(article.publishedAt)}</span>
          {updatedMeaningfully && <span>(updated {formatDate(article.updatedAt)})</span>}
          <span>·</span>
          <span>{formatReadingTime(article.content)}</span>
        </div>

        <div className="journal-prose" dangerouslySetInnerHTML={{ __html: article.content }} />

        {article.tags.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/journal?tag=${tag.slug}`}
                className="focus-ring tracked-label rounded-full border border-white/15 px-3 py-1 text-white/60 transition hover:border-white/40 hover:text-white"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
