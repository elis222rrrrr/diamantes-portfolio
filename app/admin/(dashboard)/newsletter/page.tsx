import { requireRole } from "@/lib/auth/session";
import { listSubscribers } from "@/lib/newsletter/repository";

export default async function NewsletterPage() {
  await requireRole(["OWNER", "ADMIN"]);

  const subscribers = await listSubscribers();

  const activeCount = subscribers.filter((s) => !s.unsubscribedAt).length;

  return (
    <div className="max-w-3xl">
      <h1 className="mb-2 text-2xl font-light">Newsletter</h1>
      <p className="mb-10 text-sm text-muted">
        {activeCount} active subscriber{activeCount === 1 ? "" : "s"} · {subscribers.length} total.
      </p>

      {subscribers.length === 0 ? (
        <p className="text-sm text-muted">No subscribers yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {subscribers.map((subscriber) => (
            <li
              key={subscriber.id}
              className="flex items-center justify-between border border-white/10 px-4 py-3 text-sm"
            >
              <span>{subscriber.email}</span>
              <span className="tracked-label text-muted">
                {subscriber.unsubscribedAt
                  ? `Unsubscribed ${subscriber.unsubscribedAt.toISOString().slice(0, 10)}`
                  : `Since ${subscriber.subscribedAt.toISOString().slice(0, 10)}`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
