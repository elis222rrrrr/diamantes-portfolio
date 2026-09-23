import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: "Terms & Conditions",
  description: "The terms that apply to using this site and ordering from Diamantes 3Designs.",
  path: "/terms-conditions",
});

export default function TermsConditionsPage() {
  return (
    <section className="bg-black text-white">
      <div className="section-container max-w-3xl">
        <p className="tracked-label text-muted">LEGAL / TERMS & CONDITIONS</p>
        <div className="mt-3 h-px w-6" style={{ backgroundColor: "var(--focus-ring)" }} />
        <h1 className="section-heading mt-4">Terms & Conditions</h1>
        <p className="mt-4 text-sm text-muted">Last updated: September 2026.</p>

        <div className="mt-12 space-y-10 text-sm leading-relaxed text-muted">
          <section>
            <h2 className="mb-3 text-lg text-white">Who we are</h2>
            <p>
              Diamantes 3Designs is a jewelry and accessory shop based in Greece, operated by
              Elisavet Nithavrianaki. These terms apply whenever you use this website or buy a
              product from the shop. Contact us at{" "}
              <a className="text-white underline" href="mailto:diamantesdesignsbyelis@gmail.com">
                diamantesdesignsbyelis@gmail.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg text-white">Shop orders</h2>
            <p>
              Product listings, prices, and availability can change without notice. Placing an order
              through checkout is an offer to buy; we confirm it once payment succeeds. Payments are
              processed securely by Stripe. This site never receives or stores your card details.
              Shipping costs, delivery, and our refund policy are set out on the{" "}
              <a className="text-white underline" href="/shipping-returns">
                Shipping & Returns
              </a>{" "}
              page, which forms part of these terms.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg text-white">Intellectual property</h2>
            <p>
              Designs, renders, photography, and written content on this site remain the property of
              Diamantes 3Designs. Buying a physical product doesn&rsquo;t transfer rights to the
              underlying design, and it doesn&rsquo;t authorize reproducing, reselling the design
              itself, or casting/printing copies.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg text-white">Availability & accuracy</h2>
            <p>
              We try to keep product, pricing, and shipping information accurate, but errors can
              happen. A listing may be mispriced, out of stock, or discontinued after you&rsquo;ve
              seen it. If that happens with your order, we&rsquo;ll contact you before charging or
              fulfilling anything incorrectly, and you can cancel for a full refund.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg text-white">Liability</h2>
            <p>
              Nothing in these terms limits liability where the law doesn&rsquo;t allow it to be
              limited. Otherwise, this site and its content are provided as-is; we&rsquo;re not
              liable for indirect or consequential losses arising from your use of the site, to the
              extent permitted by Greek and EU law.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg text-white">Governing law</h2>
            <p>
              These terms are governed by Greek law. If you&rsquo;re a consumer based elsewhere in
              the EU, you also keep whatever mandatory consumer-protection rights apply in your own
              country of residence.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg text-white">Changes</h2>
            <p>
              We may update these terms as the site and services change. The version in effect is
              the one published here at the time of your order or use of the site.
            </p>
          </section>
        </div>
      </div>
    </section>
  );
}
