import Image from "next/image";

type Props = {
  src: string;
  alt: string;
  caption: string;
  /** CSS aspect-ratio value, e.g. "1206/2144" */
  aspect: string;
  className?: string;
};

/** A small photo with corner register-marks instead of a plain card border —
 * reads as a technical/blueprint reference mark, closer to this studio's
 * engineering-meets-art identity than a generic bordered photo card. */
export default function FramedPhoto({ src, alt, caption, aspect, className = "" }: Props) {
  return (
    <figure className={`mx-auto w-full max-w-[220px] lg:mx-0 ${className}`}>
      <div className="relative p-3">
        <span
          aria-hidden
          className="absolute left-0 top-0 h-4 w-4 border-l border-t border-white/30"
        />
        <span
          aria-hidden
          className="absolute right-0 top-0 h-4 w-4 border-r border-t border-white/30"
        />
        <span
          aria-hidden
          className="absolute bottom-0 left-0 h-4 w-4 border-b border-l border-white/30"
        />
        <span
          aria-hidden
          className="absolute bottom-0 right-0 h-4 w-4 border-b border-r border-white/30"
        />
        <div
          className="relative w-full overflow-hidden border border-white/10"
          style={{ aspectRatio: aspect }}
        >
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 280px, 220px"
          />
        </div>
      </div>
      <figcaption className="tracked-label mt-1 text-center text-white/50 lg:text-left">
        {caption}
      </figcaption>
    </figure>
  );
}
