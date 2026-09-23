import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { signedAttachmentUrl } from "@/lib/storage/cloudinary";
import Card from "@/components/ui/Card";

export default async function MessagesPage() {
  await requireRole(["OWNER", "ADMIN"]);

  const messages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-3xl">
      <h1 className="mb-2 text-2xl font-light">Messages</h1>
      <p className="mb-10 text-sm text-muted">Contact form submissions, newest first.</p>

      {messages.length === 0 ? (
        <p className="text-sm text-muted">No messages yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {messages.map((message) => {
            const attachmentHref =
              message.attachmentPublicId && message.attachmentName
                ? signedAttachmentUrl(
                    message.attachmentPublicId,
                    message.attachmentName.split(".").pop() ?? "bin",
                    (message.attachmentType ?? "").startsWith("image/")
                  )
                : null;

            return (
              <Card as="li" key={message.id}>
                <div className="mb-2 flex items-baseline justify-between gap-4">
                  <p className="text-sm text-white/70">
                    {message.name} · {message.email}
                  </p>
                  <p className="tracked-label shrink-0 text-muted">
                    {message.createdAt.toISOString().slice(0, 10)}
                  </p>
                </div>
                <p className="whitespace-pre-wrap text-sm text-muted">{message.message}</p>
                {attachmentHref && (
                  <a
                    href={attachmentHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="focus-ring tracked-label mt-3 inline-block text-muted hover:text-white"
                  >
                    {message.attachmentName ?? "View attachment"}
                  </a>
                )}
              </Card>
            );
          })}
        </ul>
      )}
    </div>
  );
}
