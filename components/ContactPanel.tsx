import Link from "next/link";
import { Mail, CalendarClock } from "lucide-react";
import CutWord from "./CutWord";

type Props = {
  as?: "h1" | "h2";
};

export default function ContactPanel({ as: Heading = "h2" }: Props) {
  return (
    <div className="w-full max-w-xl text-white">
      <p className="tracked-label text-white/40">
        <span style={{ color: "var(--focus-ring)" }}>[ 04 ]</span> GET IN TOUCH
      </p>
      <div className="mt-3 h-px w-6 bg-white/20" />

      {/* No chrome-text gradient here (per feedback) — solid --foreground,
          same as the homepage Hero's own "DIAMANTES" h1, plus that title's
          CutWord letter treatment (see CutWord.tsx) instead of a plain
          heading. "START A PROJECT" on top, "TODAY." below (per feedback).

          One CutWord per word with a real JSX space between them (matching
          how the Hero's own DIAMANTES/DESIGNS title uses it) — an earlier
          version put the word-spaces inside a single CutWord's text, which
          rendered each space as its own inline-block span instead of a
          normal word gap, squeezing the words together.

          Each word individually wrapped in whitespace-nowrap — same reason
          DIAMANTES/DESIGNS do it: every letter is its own inline-block span,
          so without this a narrow container can break a word apart
          mid-letter ("PROJ"/"ECT") instead of wrapping at the space between
          words, which the <br/> below already handles on purpose. */}
      <Heading
        className="contact-heading section-heading mb-8 mt-4 leading-none"
        style={{ fontFamily: "var(--font-orbitron)", color: "var(--foreground)" }}
      >
        {/* No outer nowrap around all three words (unlike each word's own
            wrapper below) — at this heading's smallest clamped size, on a
            narrow phone, "START A PROJECT" forced onto one unbreakable
            line can overflow the viewport with nowhere to wrap. Matches
            ContactEmailForm.tsx's identical heading, which only protects
            individual words and lets them wrap onto separate lines. */}
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
      </Heading>

      <p className="mb-8 text-sm leading-relaxed text-muted">
        Send a message or book a 30-minute call, whichever is easier for you.
      </p>

      {/* No pill/border shape — a dot, icon + label, then a closing dot,
          no connecting line (removed per feedback). Centered (per
          feedback), not left-aligned like the rest of the panel. */}
      <div className="flex items-center justify-center gap-4 sm:gap-10">
        <Link
          href="/contact/email"
          className="focus-ring group flex items-center gap-3 whitespace-nowrap text-white transition hover:text-[var(--focus-ring)]"
        >
          <span className="h-1.5 w-1.5 shrink-0 bg-current" />
          <Mail size={18} />
          Email
          <span className="h-1.5 w-1.5 shrink-0 bg-current" />
        </Link>

        <Link
          href="/contact/book"
          className="focus-ring group flex items-center gap-3 whitespace-nowrap text-white transition hover:text-[var(--focus-ring)]"
        >
          <span className="h-1.5 w-1.5 shrink-0 bg-current" />
          <CalendarClock size={18} />
          Book a 30-min call
          <span className="h-1.5 w-1.5 shrink-0 bg-current" />
        </Link>
      </div>
    </div>
  );
}
