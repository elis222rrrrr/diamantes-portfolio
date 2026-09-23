import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { listAllProducts } from "@/lib/shop/repository";
import { formatPriceCents } from "@/lib/shop/format";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import Card from "@/components/ui/Card";
import LinkButton from "@/components/ui/LinkButton";
import { deleteProductAction } from "./actions";

export default async function ProductsPage() {
  await requireRole(["OWNER", "ADMIN"]);

  const products = await listAllProducts();

  return (
    <div className="max-w-4xl">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-2xl font-light">Products</h1>
          <p className="text-sm text-muted">Manage the shop&apos;s catalog.</p>
        </div>
        <LinkButton href="/admin/products/new">New product</LinkButton>
      </div>

      {products.length === 0 ? (
        <p className="text-sm text-muted">No products yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {products.map((product) => (
            <Card as="li" key={product.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm">
                    {product.name}
                    {!product.isActive && (
                      <span className="tracked-label ml-2 text-muted">(inactive)</span>
                    )}
                  </p>
                  <p className="mt-1 text-sm text-white/70">
                    {formatPriceCents(product.priceCents, product.currency)} ·{" "}
                    {product.variants.length > 0
                      ? `${product.variants.length} color${product.variants.length === 1 ? "" : "s"}`
                      : product.stock === null
                        ? "Unlimited"
                        : `${product.stock} in stock`}{" "}
                    · {product.type} · {product.images.length} image
                    {product.images.length === 1 ? "" : "s"}
                  </p>
                  <p className="mt-1 text-xs text-muted">/{product.slug}</p>
                </div>
                <div className="flex items-center gap-4">
                  <Link
                    href={`/admin/products/${product.id}/edit`}
                    className="focus-ring tracked-label text-white/70 transition hover:text-white"
                  >
                    Edit
                  </Link>
                  <ConfirmSubmitButton
                    action={deleteProductAction.bind(null, product.id)}
                    triggerLabel="Delete"
                    triggerClassName="focus-ring tracked-label text-white/70 transition hover:text-white"
                    title="Delete this product?"
                    message={`This will permanently delete "${product.name}". Products with existing orders can't be deleted — deactivate them instead.`}
                    confirmLabel="Delete product"
                  />
                </div>
              </div>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}
