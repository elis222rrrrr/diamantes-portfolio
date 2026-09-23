"use client";

import { useState, useTransition, useRef } from "react";
import Image from "next/image";
import Cropper, { type Area } from "react-easy-crop";
import { X, Upload, Crop as CropIcon } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { cropImageToBlob } from "@/lib/journal/crop-image";
import { uploadJournalImageAction } from "@/app/admin/(dashboard)/journal/actions";

type Props = {
  initialUrl?: string | null;
  initialAlt?: string | null;
  initialCaption?: string | null;
};

/** The Featured Image field: pick a file, crop it (react-easy-crop, 16:9 by
 * default), upload the cropped result, then set alt text/caption — all
 * client-side state mirrored into hidden inputs so the surrounding
 * ArticleForm's normal FormData submission picks it up like any other field. */
export default function FeaturedImageEditor({ initialUrl, initialAlt, initialCaption }: Props) {
  const [url, setUrl] = useState(initialUrl ?? "");
  const [alt, setAlt] = useState(initialAlt ?? "");
  const [caption, setCaption] = useState(initialCaption ?? "");

  const [rawImage, setRawImage] = useState<string | null>(null); // object URL awaiting crop
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setRawImage(URL.createObjectURL(file));
    setError(null);
  }

  function confirmCrop() {
    if (!rawImage || !croppedAreaPixels) return;
    startTransition(async () => {
      try {
        const blob = await cropImageToBlob(rawImage, croppedAreaPixels);
        const formData = new FormData();
        formData.set("file", new File([blob], "featured-image.jpg", { type: "image/jpeg" }));
        const result = await uploadJournalImageAction(formData);
        if ("error" in result) {
          setError(result.error);
          return;
        }
        setUrl(result.url);
        setRawImage(null);
      } catch {
        setError("Could not process that image. Please try another.");
      }
    });
  }

  function removeImage() {
    setUrl("");
    setAlt("");
    setCaption("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name="featuredImageUrl" value={url} readOnly />
      <input type="hidden" name="featuredImageAlt" value={alt} readOnly />
      <input type="hidden" name="featuredImageCaption" value={caption} readOnly />

      {rawImage ? (
        <div className="flex flex-col gap-3">
          <div className="relative h-64 w-full bg-black">
            <Cropper
              image={rawImage}
              crop={crop}
              zoom={zoom}
              aspect={16 / 9}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
            />
          </div>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            aria-label="Zoom"
          />
          <div className="flex gap-3">
            <Button
              type="button"
              onClick={confirmCrop}
              pending={isPending}
              pendingLabel="Uploading…"
              className="flex items-center gap-2 px-4 py-2"
            >
              <CropIcon size={14} /> Use this crop
            </Button>
            <Button type="button" onClick={() => setRawImage(null)} className="px-4 py-2">
              Cancel
            </Button>
          </div>
        </div>
      ) : url ? (
        <div className="flex flex-col gap-3">
          <div className="relative aspect-[16/9] w-full max-w-md overflow-hidden bg-white/5">
            <Image src={url} alt={alt || "Featured image"} fill className="object-cover" />
            <button
              type="button"
              aria-label="Remove image"
              onClick={removeImage}
              className="focus-ring absolute right-2 top-2 bg-black/70 p-1.5 text-white hover:bg-black"
            >
              <X size={14} />
            </button>
          </div>
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-fit items-center gap-2 px-4 py-2"
          >
            <Upload size={14} /> Replace image
          </Button>

          <label className="text-xs text-muted">
            Alt text (for accessibility &amp; SEO)
            <Input value={alt} onChange={(e) => setAlt(e.target.value)} className="mt-1 w-full" />
          </label>
          <label className="text-xs text-muted">
            Caption (optional, shown under the image)
            <Input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="mt-1 w-full"
            />
          </label>
        </div>
      ) : (
        <Button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex w-fit items-center gap-2 px-6 py-4"
        >
          <Upload size={16} /> Upload featured image
        </Button>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
