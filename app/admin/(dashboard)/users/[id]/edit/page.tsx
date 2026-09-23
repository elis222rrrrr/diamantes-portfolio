import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { findById } from "@/lib/users/repository";
import UserForm from "../../UserForm";
import { updateUserAction } from "../../actions";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["OWNER"]);
  const { id } = await params;

  const user = await findById(id);
  if (!user) notFound();

  return (
    <div>
      <h1 className="mb-8 text-2xl font-light">Edit user</h1>
      <UserForm action={updateUserAction.bind(null, id)} user={user} submitLabel="Save changes" />
    </div>
  );
}
