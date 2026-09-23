"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import BracketButton from "@/components/ui/BracketButton";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import FormError from "@/components/ui/FormError";
import CutWord from "@/components/CutWord";
import { submitContactEmail } from "./actions";

export default function ContactEmailForm() {
  const [state, formAction, pending] = useActionState(submitContactEmail, {});

  return (
    <section className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-white">
      <div className="w-full max-w-md">
        <Link
          href="/#contact"
          className="focus-ring tracked-label mb-8 inline-flex items-center gap-2 text-muted transition hover:text-white"
        >
          <ArrowLeft size={14} />
          Back
        </Link>

        <p className="tracked-label mb-3 text-muted">Get in touch</p>
        <div className="mb-3 h-px w-6" style={{ backgroundColor: "var(--focus-ring)" }} />
        <h1
          className="mb-8 text-4xl font-light leading-none"
          style={{ fontFamily: "var(--font-orbitron)" }}
        >
          <span className="whitespace-nowrap">
            <CutWord text="START" cuts={[1]} />
          </span>{" "}
          <span className="whitespace-nowrap">
            <CutWord text="A" />
          </span>{" "}
          <span className="whitespace-nowrap">
            <CutWord text="PROJECT" cuts={[3]} />
          </span>
          <br />
          <span className="whitespace-nowrap">
            <CutWord text="TODAY." cuts={[1]} />
          </span>
        </h1>

        {state.success ? (
          <p role="status" className="text-sm leading-relaxed text-white/60">
            Thank you, your message has been received. We&apos;ll reply shortly.
          </p>
        ) : (
          <form action={formAction} className="flex flex-col gap-4">
            <label htmlFor="contact-email-name" className="sr-only">
              Name
            </label>
            <Input
              required
              id="contact-email-name"
              type="text"
              name="name"
              placeholder="Name"
              size="md"
            />

            <label htmlFor="contact-email-email" className="sr-only">
              Email
            </label>
            <Input
              required
              id="contact-email-email"
              type="email"
              name="email"
              placeholder="Email"
              size="md"
            />

            <label htmlFor="contact-email-message" className="sr-only">
              Message
            </label>
            <Textarea
              required
              id="contact-email-message"
              name="message"
              placeholder="Tell us about your project"
              rows={4}
              size="md"
            />

            <label
              htmlFor="contact-email-attachment"
              className="flex flex-col gap-2 text-xs text-muted"
            >
              Attachment (optional, image or PDF, up to 8MB)
              <input
                id="contact-email-attachment"
                type="file"
                name="attachment"
                accept="image/png,image/jpeg,image/webp,application/pdf"
                className="focus-ring text-sm text-white/60 file:mr-4 file:border file:border-white/15 file:bg-transparent file:px-3 file:py-2 file:text-xs file:text-white/70"
              />
            </label>

            <FormError error={state.error} />

            <BracketButton
              type="submit"
              pending={pending}
              className="mt-2 flex items-center justify-center gap-3 px-8 py-4"
            >
              {pending ? "Sending…" : "Send Message"}
              <ArrowRight size={18} />
            </BracketButton>
          </form>
        )}
      </div>
    </section>
  );
}
