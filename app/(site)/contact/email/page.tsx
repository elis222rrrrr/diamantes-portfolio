import ContactEmailForm from "./ContactEmailForm";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: "Contact via Email",
  description: "Send Diamantes 3Designs a message, with an optional file attachment.",
  path: "/contact/email",
});

export default function ContactEmailPage() {
  return <ContactEmailForm />;
}
