import type { Metadata } from "next";
import CartView from "@/components/CartView";

export const metadata: Metadata = {
  title: "Cart",
  description: "Your Diamantes 3Designs cart.",
};

export default function CartPage() {
  return <CartView />;
}
