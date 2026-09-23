"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { fadeInUp } from "./motion/variants";
import ProductCard from "./ProductCard";

type Variant = {
  id: string;
  color: string;
  imageUrl: string | null;
  images: unknown;
  isDefault: boolean;
  stock: number | null;
  isActive: boolean;
};

type Product = {
  id: string;
  slug: string;
  name: string;
  type: "PHYSICAL" | "DIGITAL" | "COMMISSION";
  priceCents: number;
  currency: string;
  stock: number | null;
  images: { url: string }[];
  variants: Variant[];
};

type Props = {
  as?: "h1" | "h2";
  products: Product[];
};

export default function ShopSection({ as: Heading = "h2", products }: Props) {
  return (
    <section id="shop" className="bg-black text-white">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeInUp}
        className="section-container"
      >
        <div className="mb-10 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="tracked-label text-white/40">
              <span style={{ color: "var(--focus-ring)" }}>[ 02 ]</span> SHOP
            </p>
            <div className="mt-3 h-px w-6 bg-white/20" />
            <Heading className="section-heading mt-4">Shop</Heading>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
              Designer accessories, made in Greece: rings, pendants and keychains cast in sterling
              silver or 3D-printed in resin, shipped worldwide.
            </p>
          </div>
          <Link
            href="/shop"
            className="focus-ring tracked-label inline-flex items-center gap-2 text-white/70 transition hover:text-white"
          >
            Visit the shop
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Real current listings — this used to be a single decorative
            gradient panel with no products shown at all. */}
        {products.length > 0 && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-6 lg:grid-cols-3">
            {products.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        )}
      </motion.div>
    </section>
  );
}
