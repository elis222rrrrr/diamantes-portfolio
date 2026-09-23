import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { findProductById } from "@/lib/shop/repository";
import ProductForm from "../../ProductForm";
import { updateProductAction } from "../../actions";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["OWNER", "ADMIN"]);
  const { id } = await params;

  const product = await findProductById(id);
  if (!product) notFound();

  return (
    <div>
      <h1 className="mb-8 text-2xl font-light">Edit product</h1>
      <ProductForm
        action={updateProductAction.bind(null, id)}
        product={product}
        submitLabel="Save changes"
      />
    </div>
  );
}
