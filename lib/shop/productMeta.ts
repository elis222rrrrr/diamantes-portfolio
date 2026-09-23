const PRODUCT_OBJECT_TYPES: Record<string, string> = {
  "nebula-ring": "RING",
  "shoe-key": "KEYCHAIN",
  "ods-32": "BAG",
};

export function objectTypeForProduct(slug: string): string | undefined {
  return PRODUCT_OBJECT_TYPES[slug];
}
