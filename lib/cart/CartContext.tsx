"use client";

import { useMemo, useSyncExternalStore } from "react";

export type CartItem = {
  productId: string;
  variantId?: string;
  color?: string;
  slug: string;
  name: string;
  priceCents: number;
  currency: string;
  imageUrl: string | null;
  type: "PHYSICAL" | "DIGITAL" | "COMMISSION";
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotalCents: number;
  hasPhysicalItem: boolean;
  addItem: (product: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: string, variantId?: string) => void;
  setQuantity: (productId: string, variantId: string | undefined, quantity: number) => void;
  clear: () => void;
};

const STORAGE_KEY = "d3d-cart";
// Sanity ceiling for cart UI only — the checkout action re-reads real stock/price
// from the DB regardless of anything stored here.
const MAX_QUANTITY_PER_ITEM = 20;

// A product with color variants can appear as more than one cart line (one
// per color), so the line's identity is productId + variantId, not productId
// alone.
function lineKey(productId: string, variantId?: string): string {
  return `${productId}:${variantId ?? ""}`;
}

// The cart is a single module-level store backed by localStorage, read via
// useSyncExternalStore — the sanctioned way to read a value that can differ
// between server and first client render without a setState-in-effect
// cascade (localStorage isn't available during SSR at all).
let cartState: CartItem[] = [];
let hydrated = false;
type Listener = () => void;
let listeners: Listener[] = [];

function loadFromStorage(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
}

function ensureHydrated(): void {
  if (hydrated || typeof window === "undefined") return;
  cartState = loadFromStorage();
  hydrated = true;
}

function emitChange(): void {
  for (const listener of listeners) listener();
}

function setCart(next: CartItem[]): void {
  cartState = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  emitChange();
}

function subscribe(listener: Listener): () => void {
  ensureHydrated();
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getSnapshot(): CartItem[] {
  ensureHydrated();
  return cartState;
}

function getServerSnapshot(): CartItem[] {
  return cartState;
}

function addItem(product: Omit<CartItem, "quantity">, quantity = 1): void {
  const key = lineKey(product.productId, product.variantId);
  const existing = cartState.find((item) => lineKey(item.productId, item.variantId) === key);
  if (existing) {
    setCart(
      cartState.map((item) =>
        lineKey(item.productId, item.variantId) === key
          ? { ...item, quantity: Math.min(item.quantity + quantity, MAX_QUANTITY_PER_ITEM) }
          : item
      )
    );
    return;
  }
  setCart([...cartState, { ...product, quantity: Math.min(quantity, MAX_QUANTITY_PER_ITEM) }]);
}

function removeItem(productId: string, variantId?: string): void {
  const key = lineKey(productId, variantId);
  setCart(cartState.filter((item) => lineKey(item.productId, item.variantId) !== key));
}

function setQuantity(productId: string, variantId: string | undefined, quantity: number): void {
  if (quantity <= 0) {
    removeItem(productId, variantId);
    return;
  }
  const key = lineKey(productId, variantId);
  setCart(
    cartState.map((item) =>
      lineKey(item.productId, item.variantId) === key
        ? { ...item, quantity: Math.min(quantity, MAX_QUANTITY_PER_ITEM) }
        : item
    )
  );
}

function clear(): void {
  setCart([]);
}

/** Kept as a no-op passthrough so call sites don't need to change if this
 * ever grows real per-subtree state — today the store above is global. */
export function CartProvider({ children }: { children: React.ReactNode }) {
  return children;
}

export function useCart(): CartContextValue {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const subtotalCents = useMemo(
    () => items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0),
    [items]
  );
  const hasPhysicalItem = useMemo(() => items.some((item) => item.type === "PHYSICAL"), [items]);

  return {
    items,
    itemCount,
    subtotalCents,
    hasPhysicalItem,
    addItem,
    removeItem,
    setQuantity,
    clear,
  };
}
