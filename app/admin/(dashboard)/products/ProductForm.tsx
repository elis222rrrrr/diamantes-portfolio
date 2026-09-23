"use client";

import { useActionState, useState } from "react";
import { Plus, X } from "lucide-react";
import { formatPriceCents } from "@/lib/shop/format";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import FormError from "@/components/ui/FormError";
import type { ActionState } from "./actions";

const TYPE_OPTIONS = [
  { value: "PHYSICAL", label: "Physical" },
  { value: "DIGITAL", label: "Digital" },
  { value: "COMMISSION", label: "Commission" },
];

const labelClass = "text-xs text-muted";

type Product = {
  slug: string;
  name: string;
  description: string;
  type: "PHYSICAL" | "DIGITAL" | "COMMISSION";
  priceCents: number;
  stock: number | null;
  isActive: boolean;
  images: { url: string }[];
  variants: {
    color: string;
    imageUrl: string | null;
    images: unknown;
    isDefault: boolean;
    stock: number | null;
    isActive: boolean;
  }[];
};

type VariantRow = {
  color: string;
  imageUrl: string;
  images: string[];
  isDefault: boolean;
  stock: string;
  isActive: boolean;
};

type Props = {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  product?: Product;
  submitLabel: string;
};

export default function ProductForm({ action, product, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, null);

  const [priceEuros, setPriceEuros] = useState<string>(
    product ? (product.priceCents / 100).toFixed(2) : ""
  );
  const [images, setImages] = useState<string[]>(
    product && product.images.length > 0 ? product.images.map((i) => i.url) : [""]
  );
  const [variants, setVariants] = useState<VariantRow[]>(
    product?.variants.map((v) => ({
      color: v.color,
      imageUrl: v.imageUrl ?? "",
      images: Array.isArray(v.images)
        ? v.images.filter((u): u is string => typeof u === "string")
        : [],
      isDefault: v.isDefault,
      stock: v.stock === null ? "" : String(v.stock),
      isActive: v.isActive,
    })) ?? []
  );

  const parsedPrice = Number(priceEuros);
  const previewPriceCents =
    priceEuros.trim() !== "" && Number.isFinite(parsedPrice) && parsedPrice >= 0
      ? Math.round(parsedPrice * 100)
      : null;

  const cleanImages = images.filter((url) => url.trim() !== "");
  const cleanVariants = variants
    .filter((v) => v.color.trim() !== "")
    .map((v) => ({
      color: v.color.trim(),
      imageUrl: v.imageUrl.trim() === "" ? null : v.imageUrl.trim(),
      images: v.images.map((u) => u.trim()).filter((u) => u !== ""),
      isDefault: v.isDefault,
      stock: v.stock.trim() === "" ? null : Number(v.stock),
      isActive: v.isActive,
    }));

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4">
      <input type="hidden" name="images" readOnly value={JSON.stringify(cleanImages)} />
      <input type="hidden" name="variants" readOnly value={JSON.stringify(cleanVariants)} />

      <label htmlFor="product-slug" className={labelClass}>
        Slug (URL — lowercase, hyphens only)
      </label>
      <Input
        id="product-slug"
        type="text"
        name="slug"
        required
        pattern="[a-z0-9-]+"
        defaultValue={product?.slug}
      />

      <label htmlFor="product-name" className={labelClass}>
        Name
      </label>
      <Input id="product-name" type="text" name="name" required defaultValue={product?.name} />

      <label htmlFor="product-description" className={labelClass}>
        Description
      </label>
      <Textarea
        id="product-description"
        name="description"
        required
        rows={4}
        defaultValue={product?.description}
      />

      <label htmlFor="product-type" className={labelClass}>
        Type
      </label>
      <Select id="product-type" name="type" defaultValue={product?.type ?? "PHYSICAL"}>
        {TYPE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-black">
            {opt.label}
          </option>
        ))}
      </Select>

      <label htmlFor="product-price" className={labelClass}>
        Price (EUR)
      </label>
      <div className="flex items-center gap-3">
        <Input
          id="product-price"
          type="number"
          name="price"
          required
          min={0}
          step={0.01}
          value={priceEuros}
          onChange={(e) => setPriceEuros(e.target.value)}
          placeholder="19.99"
          className="w-32"
        />
        <span className="text-xs text-muted">
          {previewPriceCents !== null
            ? formatPriceCents(previewPriceCents, "eur")
            : "Enter a price"}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <span className={labelClass}>Images</span>
        {images.map((url, index) => (
          <div key={index} className="flex gap-2">
            <Input
              type="url"
              value={url}
              placeholder="https://res.cloudinary.com/..."
              onChange={(e) =>
                setImages((current) => current.map((u, i) => (i === index ? e.target.value : u)))
              }
              className="flex-1"
            />
            <button
              type="button"
              aria-label="Remove image"
              onClick={() => setImages((current) => current.filter((_, i) => i !== index))}
              className="focus-ring border border-white/15 px-2 text-white/50 transition hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setImages((current) => [...current, ""])}
          className="focus-ring tracked-label flex w-fit items-center gap-1 text-white/60 transition hover:text-white"
        >
          <Plus size={12} /> Add image
        </button>
      </div>

      <label htmlFor="product-stock" className={labelClass}>
        Stock (leave blank for unlimited — ignored if colors are set below)
      </label>
      <Input
        id="product-stock"
        type="number"
        name="stock"
        min={0}
        step={1}
        defaultValue={product?.stock ?? ""}
      />

      <div className="flex flex-col gap-2">
        <span className={labelClass}>Colors (optional — each color tracks its own stock)</span>
        {variants.map((variant, index) => (
          <div key={index} className="flex flex-col gap-1.5 border border-white/10 p-2">
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={variant.color}
                placeholder="Color (e.g. Matte Black)"
                onChange={(e) =>
                  setVariants((current) =>
                    current.map((v, i) => (i === index ? { ...v, color: e.target.value } : v))
                  )
                }
                className="flex-1"
              />
              <Input
                type="number"
                min={0}
                step={1}
                value={variant.stock}
                placeholder="Stock"
                onChange={(e) =>
                  setVariants((current) =>
                    current.map((v, i) => (i === index ? { ...v, stock: e.target.value } : v))
                  )
                }
                className="w-24"
              />
              <label className="flex items-center gap-1 text-xs text-white/70">
                <input
                  type="checkbox"
                  checked={variant.isActive}
                  onChange={(e) =>
                    setVariants((current) =>
                      current.map((v, i) =>
                        i === index ? { ...v, isActive: e.target.checked } : v
                      )
                    )
                  }
                />
                Active
              </label>
              <button
                type="button"
                aria-label="Remove color"
                onClick={() => setVariants((current) => current.filter((_, i) => i !== index))}
                className="focus-ring border border-white/15 px-2 text-white/50 transition hover:text-white"
              >
                <X size={14} />
              </button>
            </div>
            <Input
              type="url"
              value={variant.imageUrl}
              placeholder="Cover photo for this color — https://res.cloudinary.com/..."
              onChange={(e) =>
                setVariants((current) =>
                  current.map((v, i) => (i === index ? { ...v, imageUrl: e.target.value } : v))
                )
              }
            />

            <label className="flex items-center gap-1 text-xs text-white/70">
              <input
                type="radio"
                name="defaultVariant"
                checked={variant.isDefault}
                onChange={() =>
                  setVariants((current) =>
                    current.map((v, i) => ({ ...v, isDefault: i === index }))
                  )
                }
              />
              Default color (pre-selected on the shop page)
            </label>

            <div className="flex flex-col gap-1.5 pl-3">
              <span className="text-[11px] text-muted">
                More angles for this color (3/4, top, bottom, …) — shown after the cover photo once
                this color is picked
              </span>
              {variant.images.map((url, imgIndex) => (
                <div key={imgIndex} className="flex gap-2">
                  <Input
                    type="url"
                    value={url}
                    placeholder="https://res.cloudinary.com/..."
                    onChange={(e) =>
                      setVariants((current) =>
                        current.map((v, i) =>
                          i === index
                            ? {
                                ...v,
                                images: v.images.map((u, j) =>
                                  j === imgIndex ? e.target.value : u
                                ),
                              }
                            : v
                        )
                      )
                    }
                    className="flex-1"
                  />
                  <button
                    type="button"
                    aria-label="Remove angle image"
                    onClick={() =>
                      setVariants((current) =>
                        current.map((v, i) =>
                          i === index
                            ? { ...v, images: v.images.filter((_, j) => j !== imgIndex) }
                            : v
                        )
                      )
                    }
                    className="focus-ring border border-white/15 px-2 text-white/50 transition hover:text-white"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setVariants((current) =>
                    current.map((v, i) => (i === index ? { ...v, images: [...v.images, ""] } : v))
                  )
                }
                className="focus-ring tracked-label flex w-fit items-center gap-1 text-white/60 transition hover:text-white"
              >
                <Plus size={12} /> Add angle
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            setVariants((current) => [
              ...current,
              { color: "", imageUrl: "", images: [], isDefault: false, stock: "", isActive: true },
            ])
          }
          className="focus-ring tracked-label flex w-fit items-center gap-1 text-white/60 transition hover:text-white"
        >
          <Plus size={12} /> Add color
        </button>
      </div>

      {product && (
        <label className="flex items-center gap-2 text-sm text-white/70">
          <input type="checkbox" name="isActive" defaultChecked={product.isActive} />
          Active (visible in the shop)
        </label>
      )}

      <FormError error={state?.error} />

      <Button
        type="submit"
        pending={pending}
        pendingLabel="Saving…"
        className="mt-2 w-fit px-6 py-3"
      >
        {submitLabel}
      </Button>
    </form>
  );
}
