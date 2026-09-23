import "server-only";

import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

let configured = false;

function ensureConfigured() {
  if (configured) return;

  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
  const api_key = process.env.CLOUDINARY_API_KEY;
  const api_secret = process.env.CLOUDINARY_API_SECRET;

  if (!cloud_name || !api_key || !api_secret) {
    throw new Error(
      "CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET must all be set."
    );
  }

  cloudinary.config({ cloud_name, api_key, api_secret });
  configured = true;
}

export function uploadAttachment(
  buffer: Buffer,
  filename: string
): Promise<{ name: string; publicId: string }> {
  ensureConfigured();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
        type: "authenticated", // private delivery — see signedAttachmentUrl() below for access
        folder: "contact-attachments",
        filename_override: filename,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed with no result."));
          return;
        }
        // Deliberately not returning result.secure_url: for `type: "authenticated"`
        // assets, Cloudinary embeds its own non-expiring signature directly in
        // that URL (confirmed by testing — it keeps working indefinitely with no
        // time limit), so storing/passing it around would defeat the point of
        // "private" delivery. signedAttachmentUrl() below uses the *download* API
        // instead, which does honor expires_at.
        resolve({ name: filename, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
}

/**
 * Generates a fresh, genuinely time-limited signed URL (via Cloudinary's
 * download API, not its CDN delivery URL — the latter's signature never
 * expires for authenticated assets) for a previously-uploaded attachment.
 * Called at render time (e.g. the admin Messages page) rather than stored.
 */
export function signedAttachmentUrl(
  publicId: string,
  format: string,
  isImage: boolean,
  expiresInSeconds = 3600
): string {
  ensureConfigured();

  return cloudinary.utils.private_download_url(publicId, format, {
    resource_type: isImage ? "image" : "raw",
    type: "authenticated",
    expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds,
  });
}

/** Uploads a public, CDN-delivered image (Journal featured images/inline
 * content) — `type: "upload"`, unlike `uploadAttachment` above, which is
 * deliberately private. The returned `url` is a plain, non-expiring
 * `secure_url`, safe to store directly on the Article row. */
export function uploadPublicImage(
  buffer: Buffer,
  folder: string
): Promise<{ url: string; publicId: string }> {
  ensureConfigured();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "image", type: "upload", folder },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed with no result."));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
}

/** Uploads a public video (Portfolio detail-page clips) — same public,
 * non-expiring `secure_url` convention as uploadPublicImage above. */
export function uploadPublicVideo(
  buffer: Buffer,
  folder: string
): Promise<{ url: string; publicId: string }> {
  ensureConfigured();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "video", type: "upload", folder },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed with no result."));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
}

/** Uploads an arbitrary public file for direct download (e.g. a Portfolio
 * project's raw source file) — `resource_type: "raw"`, since these aren't
 * images/video Cloudinary would otherwise try to transform. Cloudinary's
 * plain upload endpoint 413s above ~100MB; use uploadPublicLargeRawFile
 * below for anything bigger. */
export function uploadPublicRawFile(
  buffer: Buffer,
  folder: string,
  filename: string
): Promise<{ url: string; publicId: string }> {
  ensureConfigured();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "raw", type: "upload", folder, filename_override: filename },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed with no result."));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
}

/** Same as uploadPublicRawFile, but chunked (Cloudinary's `upload_large`) so
 * files over the ~100MB single-request limit (e.g. a large technical
 * drawing PDF) don't 413. Takes a file path rather than a Buffer — that's
 * `upload_large`'s own interface, and it avoids buffering a huge file into
 * memory just to hand it back to Cloudinary in chunks anyway.
 *
 * Deliberately callback-based (not `await`ed directly): without a callback,
 * `upload_large` resolves to the internal upload *stream* object itself
 * (from a bare `.pipe()`), not the eventual response — confirmed by testing,
 * where `await`ing it directly produced a result with no secure_url at all,
 * because nothing had actually waited for the chunked upload to finish.
 *
 * UNRESOLVED: `chunk_size` here does not reliably control the actual part
 * size Cloudinary receives. Testing against this account's real limits (max
 * part 10485760 bytes, min part 5242880 bytes except the final one) found no
 * value that consistently worked — some attempts sent parts at roughly 2x
 * the configured chunk_size, others didn't, and a few configured values that
 * should have been safe under either theory still failed. A 114MB PDF upload
 * was abandoned in favor of uploading it manually via Cloudinary's dashboard
 * instead. Whoever picks this back up should verify against the current
 * `cloudinary` package version's chunking behavior rather than trusting the
 * chunk_size value below. */
export function uploadPublicLargeRawFile(
  filePath: string,
  folder: string,
  filename: string
): Promise<{ url: string; publicId: string }> {
  ensureConfigured();

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_large(
      filePath,
      {
        resource_type: "raw",
        type: "upload",
        folder,
        filename_override: filename,
        chunk_size: 2_700_000,
      },
      (error: unknown, result?: UploadApiResponse) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed with no result."));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
  });
}

export type MediaAsset = {
  publicId: string;
  format: string;
  bytes: number;
  width: number;
  height: number;
  createdAt: string;
  url: string;
};

/**
 * Lists public (`type: "upload"`) image assets only — contact-form
 * attachments are uploaded as `type: "authenticated"` (deliberately private,
 * see uploadAttachment above) and are excluded here on purpose, so this
 * browser doesn't undermine that existing privacy boundary. In practice this
 * lists whatever's been uploaded directly via Cloudinary's own dashboard for
 * Products/Portfolio images.
 */
export async function listMediaAssets(opts: {
  nextCursor?: string;
  maxResults?: number;
}): Promise<{ assets: MediaAsset[]; nextCursor?: string }> {
  ensureConfigured();

  const result = await cloudinary.api.resources({
    type: "upload",
    resource_type: "image",
    max_results: opts.maxResults ?? 30,
    next_cursor: opts.nextCursor,
  });

  type CloudinaryResource = {
    public_id: string;
    format: string;
    bytes: number;
    width: number;
    height: number;
    created_at: string;
    secure_url: string;
  };

  const assets: MediaAsset[] = result.resources.map((r: CloudinaryResource) => ({
    publicId: r.public_id,
    format: r.format,
    bytes: r.bytes,
    width: r.width,
    height: r.height,
    createdAt: r.created_at,
    url: r.secure_url,
  }));

  return { assets, nextCursor: result.next_cursor };
}

export async function deleteMediaAsset(publicId: string): Promise<void> {
  ensureConfigured();
  await cloudinary.api.delete_resources([publicId], { type: "upload", resource_type: "image" });
}
