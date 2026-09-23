import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getExcerpt } from "@/lib/journal/excerpt";
import { formatReadingTime } from "@/lib/journal/reading-time";

export type ArticleCardData = {
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  featuredImageUrl: string | null;
  featuredImageAlt: string | null;
  publishedAt: Date | null;
  authorName: string | null;
  category: { name: string; slug: string } | null;
};

function formatDate(date: Date | null): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/** The whole card is a single link — clicking anywhere opens the article
 * (per the Journal spec), so "Read more" is a visual affordance, not a
 * second, separately-focusable link. */
export default function ArticleCard({ article }: { article: ArticleCardData }) {
  return (
    <Link href={`/journal/${article.slug}`} className="focus-ring group flex flex-col">
      <div
        className={
          // A local site asset (e.g. "/logo-mark.png") is a mark/logo, not a
          // photo — plain black, not the card-gradient tone, per feedback.
          // bg-[#000000] (literal), not bg-black: same light-theme trap as
          // ArticleContent.tsx's identical fix (bg-black flips to white
          // under the light theme, which would hide this solid-white mark).
          article.featuredImageUrl?.startsWith("/")
            ? "relative aspect-[16/10] w-full overflow-hidden bg-[#000000]"
            : "card-gradient relative aspect-[16/10] w-full overflow-hidden"
        }
      >
        {article.featuredImageUrl && (
          <Image
            src={article.featuredImageUrl}
            alt={article.featuredImageAlt ?? article.title}
            fill
            className={
              // Same object-contain-for-marks reasoning as ArticleContent's
              // hero image — a tall, narrow logo would otherwise be cropped
              // into an unrecognizable sliver by object-cover, and extra
              // padding (per feedback) keeps it small/centered.
              article.featuredImageUrl.startsWith("/")
                ? "object-contain p-10 transition duration-500 group-hover:scale-[1.03]"
                : "object-cover transition duration-500 group-hover:scale-[1.03]"
            }
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          />
        )}
      </div>

      {/* No border-t divider — floats on the page background instead of
          sitting in a bordered box, per feedback. */}
      <div className="flex flex-1 flex-col gap-3 px-1 pt-5">
        <div className="flex items-center gap-3 text-xs text-muted">
          {article.category && <span className="tracked-label">{article.category.name}</span>}
          <span>{formatDate(article.publishedAt)}</span>
          <span>·</span>
          <span>{formatReadingTime(article.content)}</span>
        </div>

        <h3 className="text-lg font-light leading-snug">{article.title}</h3>

        <p className="line-clamp-3 flex-1 text-sm text-white/60">
          {getExcerpt(article.content, article.excerpt)}
        </p>

        <div className="mt-2 flex items-center justify-between text-xs text-muted">
          {article.authorName ? <span>{article.authorName}</span> : <span />}
          <span className="tracked-label flex items-center gap-1 text-white/70 transition group-hover:text-white">
            Read more <ArrowRight size={12} />
          </span>
        </div>
      </div>
    </Link>
  );
}
