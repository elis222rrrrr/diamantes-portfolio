import Link from "next/link";
import { notFound } from "next/navigation";
import { findSubscriberByToken } from "@/lib/newsletter/repository";
import { buildMetadata } from "@/lib/seo/metadata";
import BracketButton from "@/components/ui/BracketButton";
import { unsubscribe } from "./actions";

export const metadata = buildMetadata({
  title: "Unsubscribe",
  description: "Unsubscribe from the Diamantes 3Designs newsletter.",
  path: "/newsletter/unsubscribe",
  noIndex: true,
});

export default async function UnsubscribePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ done?: string }>;
}) {
  const { token } = await params;
  const query = await searchParams;

  const subscriber = await findSubscriberByToken(token);
  if (!subscriber) notFound();

  const isUnsubscribed = query.done || subscriber.unsubscribedAt;

  return (
    <section className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center text-white">
      {isUnsubscribed ? (
        <>
          <h1 className="mb-4 text-2xl font-light">You&apos;ve been unsubscribed</h1>
          <p className="text-sm text-muted">
            {subscriber.email} won&apos;t receive any more emails from us.
          </p>
        </>
      ) : (
        <>
          <h1 className="mb-4 text-2xl font-light">Unsubscribe?</h1>
          <p className="mb-8 text-sm text-muted">
            {subscriber.email} will stop receiving newsletter updates from Diamantes 3Designs.
          </p>
          <form action={unsubscribe.bind(null, token)}>
            <BracketButton type="submit" className="tracked-label px-6 py-3">
              Confirm unsubscribe
            </BracketButton>
          </form>
        </>
      )}

      <Link href="/" className="focus-ring tracked-label mt-10 text-muted hover:text-white">
        Back to site
      </Link>
    </section>
  );
}
