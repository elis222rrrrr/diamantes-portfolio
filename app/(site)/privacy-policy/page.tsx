import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: "Privacy Policy",
  description: "What personal data Diamantes 3Designs collects, why, and how it's handled.",
  path: "/privacy-policy",
});

export default function PrivacyPolicyPage() {
  return (
    <section className="bg-black text-white">
      <div className="section-container max-w-3xl">
        <p className="tracked-label text-muted">LEGAL / PRIVACY POLICY</p>
        <div className="mt-3 h-px w-6" style={{ backgroundColor: "var(--focus-ring)" }} />
        <h1 className="section-heading mt-4">Privacy Policy</h1>
        <p className="mt-4 text-sm text-muted">Last updated: September 2026.</p>

        <div className="mt-12 space-y-10 text-sm leading-relaxed text-muted">
          <section>
            <h2 className="mb-3 text-lg text-white">Who this covers</h2>
            <p>
              This policy explains what personal data Diamantes 3Designs (Greece) collects through
              this website, why, and how it&rsquo;s handled, for the purposes of the EU General Data
              Protection Regulation (GDPR). Contact us at{" "}
              <a className="text-white underline" href="mailto:diamantesdesignsbyelis@gmail.com">
                diamantesdesignsbyelis@gmail.com
              </a>{" "}
              for anything covered here, including exercising your rights below.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg text-white">What we collect, and why</h2>
            <ul className="list-inside list-disc space-y-2">
              <li>
                <span className="text-white/80">Contact form messages:</span> the name, email, and
                message you submit, plus any file you attach, so we can reply to you.
              </li>
              <li>
                <span className="text-white/80">Call bookings:</span> the name, email, and any notes
                you provide when booking a call, used to schedule and manage that booking.
              </li>
              <li>
                <span className="text-white/80">Orders:</span> your email, name, shipping address,
                and order contents, collected via Stripe Checkout at the time of purchase, used to
                fulfill and ship your order and handle any refund request.
              </li>
              <li>
                <span className="text-white/80">Newsletter:</span> your email address, only if you
                actively subscribe, used to send updates. Every email includes an unsubscribe link.
              </li>
              <li>
                <span className="text-white/80">Analytics cookies:</span> only set if you click
                &ldquo;Accept&rdquo; on the cookie banner; see Cookies below.
              </li>
            </ul>
            <p className="mt-3">
              We don&rsquo;t collect more than the above, and we don&rsquo;t sell personal data to
              anyone.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg text-white">Payments</h2>
            <p>
              Card payments are handled entirely by Stripe on its own hosted checkout page. This
              site never sees or stores your full card number. Stripe processes that data under its
              own privacy policy as an independent controller.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg text-white">Cookies</h2>
            <p>
              This site uses one non-essential cookie category: analytics (Google Analytics), which
              only loads after you accept the cookie banner. Declining, or not responding, means it
              never loads. A small amount of strictly necessary local storage (your cookie-banner
              choice itself, and, in the admin panel, a login session) is used regardless, since the
              site can&rsquo;t function without it; these aren&rsquo;t tracking cookies and
              don&rsquo;t require consent under GDPR/ePrivacy rules.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg text-white">Who we share data with</h2>
            <p>
              We use a small number of processors to run this site and shop, each acting under its
              own data processing terms:
            </p>
            <ul className="mt-3 list-inside list-disc space-y-2">
              <li>
                <span className="text-white/80">Stripe:</span> payment processing.
              </li>
              <li>
                <span className="text-white/80">Resend:</span> sending transactional emails (order
                confirmations, booking confirmations, contact replies).
              </li>
              <li>
                <span className="text-white/80">Cloudinary:</span> hosting images and files,
                including any file you attach to a contact message.
              </li>
              <li>
                <span className="text-white/80">Neon:</span> our Postgres database host, where the
                data above is stored.
              </li>
              <li>
                <span className="text-white/80">Sentry:</span> error monitoring, so we notice and
                fix bugs; this can incidentally capture technical data (like your browser or a
                failed request) alongside an error, not your account data.
              </li>
              <li>
                <span className="text-white/80">Google Analytics:</span> only if you accept
                analytics cookies (see above).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg text-white">How long we keep data</h2>
            <p>
              Order records are kept for as long as required for tax/accounting purposes under Greek
              law. Contact messages and booking records are kept only as long as needed to handle
              your enquiry, then deleted periodically. Newsletter emails are kept until you
              unsubscribe.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg text-white">Your rights</h2>
            <p>
              Under GDPR, you can ask us to access, correct, delete, or export the personal data we
              hold about you, or object to how it&rsquo;s used, by emailing{" "}
              <a className="text-white underline" href="mailto:diamantesdesignsbyelis@gmail.com">
                diamantesdesignsbyelis@gmail.com
              </a>
              . You can also unsubscribe from the newsletter at any time via the link in any email,
              and you have the right to lodge a complaint with the Hellenic Data Protection
              Authority (dpa.gr) or your own country&rsquo;s data protection authority.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg text-white">Changes</h2>
            <p>
              We may update this policy as the site changes. The version in effect is the one
              published here.
            </p>
          </section>
        </div>
      </div>
    </section>
  );
}
