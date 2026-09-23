export function initialVariantId(
  variants: readonly { id: string; color: string; isDefault: boolean }[],
  productSlug?: string
): string | null {
  if (variants.length === 1) return variants[0].id;

  if (productSlug === "shoe-key") {
    const resin = variants.find((variant) => variant.color.toLowerCase() === "resin");
    if (resin) return resin.id;
  }

  return variants.find((variant) => variant.isDefault)?.id ?? null;
}
