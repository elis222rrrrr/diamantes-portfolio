import ContactSection from "@/components/ContactSection";
import BreadcrumbSchema from "@/components/BreadcrumbSchema";
import FaqSection from "@/components/FaqSection";
import FaqSchema from "@/components/FaqSchema";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: "Contact",
  description: "Send Diamantes 3Designs a message or book a 30-minute call.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ]}
      />
      <FaqSchema />
      <ContactSection as="h1" />
      <FaqSection />
    </>
  );
}
