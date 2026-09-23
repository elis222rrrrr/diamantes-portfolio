export const faqs = [
  {
    question: "How do I get in touch?",
    answer:
      "Send a message by email or book a free 30-minute call directly from this page, whichever is easier for you.",
  },
  {
    question: "How does booking a call work?",
    answer:
      "Pick an available slot from the calendar. All times are shown in Greece time, and you'll get an email confirmation right away with a private link to manage your booking.",
  },
  {
    question: "Can I cancel or reschedule my booking?",
    answer:
      "Yes, every booking confirmation email includes a link to cancel or reschedule your call at any time.",
  },
  {
    question: "Where is Diamantes 3Designs based?",
    answer: "We're based in Greece, with reach and shipping worldwide.",
  },
  {
    question: "What does Diamantes 3Designs work on?",
    answer:
      "3D modeling, 3D printing, prototype engineering, CAD, fashion experimentation, and product design.",
  },
];

export default function FaqSection() {
  return (
    <section className="border-t border-white/10 bg-black text-white">
      <div className="section-container">
        <h2 className="section-heading mb-10">Frequently asked questions</h2>
        <dl className="flex flex-col gap-8">
          {faqs.map((faq) => (
            <div key={faq.question}>
              <dt className="mb-2 text-lg font-light">{faq.question}</dt>
              <dd className="max-w-2xl text-sm leading-relaxed text-muted">{faq.answer}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
