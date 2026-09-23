import { requireRole } from "@/lib/auth/session";
import { listAllCategories } from "@/lib/journal/repository";
import CategoryRow from "./CategoryRow";
import CreateCategoryForm from "./CreateCategoryForm";

export default async function JournalCategoriesPage() {
  await requireRole(["OWNER", "ADMIN"]);
  const categories = await listAllCategories();

  return (
    <div className="max-w-2xl">
      <h1 className="mb-2 text-2xl font-light">Journal Categories</h1>
      <p className="mb-10 text-sm text-muted">Every article belongs to at most one category.</p>

      <CreateCategoryForm />

      {categories.length === 0 ? (
        <p className="mt-8 text-sm text-muted">No categories yet.</p>
      ) : (
        <ul className="mt-8 flex flex-col gap-3">
          {categories.map((c) => (
            <CategoryRow key={c.id} id={c.id} name={c.name} articleCount={c._count.articles} />
          ))}
        </ul>
      )}
    </div>
  );
}
