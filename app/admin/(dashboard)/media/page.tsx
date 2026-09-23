import Image from "next/image";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { listMediaAssets } from "@/lib/storage/cloudinary";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import CopyUrlButton from "./CopyUrlButton";
import { deleteMediaAction } from "./actions";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string }>;
}) {
  await requireRole(["OWNER", "ADMIN"]);
  const { cursor } = await searchParams;

  const { assets, nextCursor } = await listMediaAssets({ nextCursor: cursor, maxResults: 30 });

  return (
    <div className="max-w-4xl">
      <h1 className="mb-2 text-2xl font-light">Media</h1>
      <p className="mb-10 text-sm text-muted">
        Images uploaded to Cloudinary (used for Products/Portfolio). Contact-form attachments are
        private and not shown here.
      </p>

      {assets.length === 0 ? (
        <p className="text-sm text-muted">No images found.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset) => (
            <div key={asset.publicId} className="border border-white/10">
              <div className="relative aspect-square w-full overflow-hidden bg-white/5">
                <Image
                  src={asset.url}
                  alt={asset.publicId}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                />
              </div>
              <div className="border-t border-white/10 p-3">
                <p className="truncate text-xs text-white/70">{asset.publicId}</p>
                <p className="tracked-label mt-1 text-muted">
                  {asset.width}×{asset.height} · {formatBytes(asset.bytes)}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <CopyUrlButton url={asset.url} />
                  <ConfirmSubmitButton
                    action={deleteMediaAction.bind(null, asset.publicId)}
                    triggerLabel="Delete"
                    triggerClassName="focus-ring tracked-label text-white/70 transition hover:text-white"
                    title="Delete this image?"
                    message="This permanently deletes it from Cloudinary. If a Product or Portfolio project still references this URL, that image will break — there's no automatic check for that."
                    confirmLabel="Delete image"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {nextCursor && (
        <Link
          href={`/admin/media?cursor=${encodeURIComponent(nextCursor)}`}
          className="focus-ring tracked-label mt-8 inline-block border border-white/15 px-4 py-2 text-white/70 transition hover:border-white/40 hover:text-white"
        >
          Load more
        </Link>
      )}
    </div>
  );
}
