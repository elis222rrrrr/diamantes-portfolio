"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart/CartContext";

/** Cart lives in the browser's localStorage — nothing server-side clears it
 * on payment, so the tracking page does it client-side once, right after a
 * successful checkout redirect. */
export default function ClearCartOnPaid() {
  const { clear } = useCart();

  useEffect(() => {
    clear();
  }, [clear]);

  return null;
}
