"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRoleForAction } from "@/lib/auth/session";
import { createProduct, updateProduct, deleteProduct } from "@/lib/shop/repository";
import { recordAudit } from "@/lib/audit/repository";

const MANAGE_ROLES = ["OWNER", "ADMIN"] as const;

const imagesSchema = z.array(z.object({ url: z.string().trim().url() })).max(20);
const variantsSchema = z
  .array(
    z.object({
      color: z.string().trim().min(1).max(100),
      imageUrl: z.string().trim().url().nullable(),
      images: z.array(z.string().trim().url()).max(20).optional(),
      isDefault: z.boolean().optional(),
      stock: z.number().int().min(0).nullable(),
      isActive: z.boolean(),
    })
  )
  .max(50);

const productSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only."),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(5000),
  type: z.enum(["PHYSICAL", "DIGITAL", "COMMISSION"]),
  // Admin enters a euro amount (e.g. "19.99"); converted to the integer cents
  // Product.priceCents actually stores right before hitting the repository.
  price: z.coerce.number().min(0),
  stock: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() !== "" ? Number(v) : null)),
  images: imagesSchema,
  variants: variantsSchema,
});

export type ActionState = { error: string } | null;

function parseProductForm(formData: FormData) {
  let images: unknown = [];
  let variants: unknown = [];
  try {
    images = JSON.parse((formData.get("images") as string | null) ?? "[]");
    variants = JSON.parse((formData.get("variants") as string | null) ?? "[]");
  } catch {
    return {
      success: false as const,
      error: { issues: [{ message: "Invalid form submission." }] },
    };
  }

  return productSchema.safeParse({
    slug: formData.get("slug"),
    name: formData.get("name"),
    description: formData.get("description"),
    type: formData.get("type"),
    price: formData.get("price"),
    stock: formData.get("stock") || undefined,
    images: (images as { url: string }[] | undefined)?.map((i) => ({ url: i.url })) ?? [],
    variants,
  });
}

export async function createProductAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireRoleForAction([...MANAGE_ROLES]);

  const parsed = parseProductForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  if (
    parsed.data.stock !== null &&
    (!Number.isInteger(parsed.data.stock) || parsed.data.stock < 0)
  ) {
    return { error: "Stock must be a whole number of 0 or more." };
  }

  const { price, ...rest } = parsed.data;
  const product = await createProduct({ ...rest, priceCents: Math.round(price * 100) });
  await recordAudit({ actorId: user.id, action: "product.created", targetId: product.id });
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function updateProductAction(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireRoleForAction([...MANAGE_ROLES]);

  const parsed = parseProductForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  if (
    parsed.data.stock !== null &&
    (!Number.isInteger(parsed.data.stock) || parsed.data.stock < 0)
  ) {
    return { error: "Stock must be a whole number of 0 or more." };
  }

  const isActive = formData.get("isActive") === "on";
  const { price, ...rest } = parsed.data;

  await updateProduct(id, { ...rest, priceCents: Math.round(price * 100), isActive });
  await recordAudit({ actorId: user.id, action: "product.updated", targetId: id });
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function deleteProductAction(id: string): Promise<{ error: string } | void> {
  const user = await requireRoleForAction([...MANAGE_ROLES]);
  const result = await deleteProduct(id);
  if (!result.ok) {
    return {
      error: "This product has existing orders and can't be deleted — deactivate it instead.",
    };
  }
  await recordAudit({ actorId: user.id, action: "product.deleted", targetId: id });
  revalidatePath("/admin/products");
}
