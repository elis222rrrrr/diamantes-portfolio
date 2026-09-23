import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: "Shipping & Returns",
  description: "Shipping costs and 10-day refund policy for Diamantes 3Designs orders.",
  path: "/shipping-returns",
});

export default function ShippingReturnsPage() {
  return (
    <section className="bg-black text-white">
      <div className="section-container max-w-3xl">
        <p className="tracked-label text-muted">SHOP / SHIPPING & RETURNS</p>
        <div className="mt-3 h-px w-6" style={{ backgroundColor: "var(--focus-ring)" }} />
        <h1 className="section-heading mt-4">Shipping & Returns</h1>

        <div className="mt-12 space-y-10 text-sm leading-relaxed text-muted">
          <section>
            <h2 className="mb-3 text-lg text-white">Shipping</h2>
            <p>
              All physical orders are shipped in protective packaging. Shipping within Greece is
              €2.90. Worldwide shipping is €15.00. The available shipping option and final cost are
              shown during Stripe checkout.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg text-white">Payment</h2>
            <p>Payments are completed securely through Stripe by card.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg text-white">Refunds</h2>
            <p>
              Refund requests must be sent within 10 calendar days from the date your order is
              received. Contact us with your order code before sending anything back. Items must be
              unused and returned in their original condition and packaging.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg text-white">Request a refund</h2>
            <p>
              Email us through the{" "}
              <a className="text-white underline" href="/contact/email">
                contact form
              </a>{" "}
              with your order code and the reason for your request. We will reply with the next
              steps and confirm the return address where required.
            </p>
          </section>
        </div>
      </div>
    </section>
  );
}
