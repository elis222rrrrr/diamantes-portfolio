import TrackOrderForm from "./TrackOrderForm";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: "Track Your Order",
  description: "Check your Diamantes 3Designs order status with your order code.",
  path: "/orders/track",
  noIndex: true,
});

export default function TrackOrderLookupPage() {
  return (
    <section className="flex flex-1 items-center bg-black text-white">
      <div className="section-container w-full max-w-3xl">
        <p className="tracked-label text-muted">ORDERS / TRACKING</p>
        <h1 className="section-heading mt-4">Track your order</h1>
        <p className="mt-6 max-w-md text-sm leading-relaxed text-muted">
          Enter the order code from your confirmation email to view payment and delivery status. No
          account is required.
        </p>
        <TrackOrderForm />
      </div>
    </section>
  );
}
