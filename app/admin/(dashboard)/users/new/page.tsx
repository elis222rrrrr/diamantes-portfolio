import { requireRole } from "@/lib/auth/session";
import UserForm from "../UserForm";
import { createUserAction } from "../actions";

export default async function NewUserPage() {
  await requireRole(["OWNER"]);

  return (
    <div>
      <h1 className="mb-8 text-2xl font-light">New user</h1>
      <UserForm action={createUserAction} submitLabel="Create user" />
    </div>
  );
}
