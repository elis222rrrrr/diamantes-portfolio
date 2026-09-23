import { requireRole } from "@/lib/auth/session";
import { listAllTags } from "@/lib/journal/repository";
import TagRow from "./TagRow";
import CreateTagForm from "./CreateTagForm";

export default async function JournalTagsPage() {
  await requireRole(["OWNER", "ADMIN"]);
  const tags = await listAllTags();

  return (
    <div className="max-w-2xl">
      <h1 className="mb-2 text-2xl font-light">Journal Tags</h1>
      <p className="mb-10 text-sm text-muted">Articles can have any number of tags.</p>

      <CreateTagForm />

      {tags.length === 0 ? (
        <p className="mt-8 text-sm text-muted">No tags yet.</p>
      ) : (
        <ul className="mt-8 flex flex-col gap-3">
          {tags.map((t) => (
            <TagRow key={t.id} id={t.id} name={t.name} articleCount={t._count.articles} />
          ))}
        </ul>
      )}
    </div>
  );
}
