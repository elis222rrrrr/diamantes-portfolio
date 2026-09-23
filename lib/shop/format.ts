export function formatPriceCents(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}
