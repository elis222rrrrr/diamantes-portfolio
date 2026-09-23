import { requireRole } from "@/lib/auth/session";
import ProductForm from "../ProductForm";
import { createProductAction } from "../actions";

export default async function NewProductPage() {
  await requireRole(["OWNER", "ADMIN"]);

  return (
    <div>
      <h1 className="mb-8 text-2xl font-light">New product</h1>
      <ProductForm action={createProductAction} submitLabel="Create product" />
    </div>
  );
}
