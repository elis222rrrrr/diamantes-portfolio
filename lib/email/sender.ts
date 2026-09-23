import "server-only";

import { injectable } from "tsyringe";
import { resend, requireFromEmail } from "./resend";
import type { EmailSender, SendEmailInput } from "./interfaces";

@injectable()
export class ResendEmailSender implements EmailSender {
  async send(input: SendEmailInput): Promise<void> {
    // The Resend SDK does not throw on API-level failures (an unverified
    // sender domain, a suppressed recipient, quota limits, etc.) — it
    // resolves with { data: null, error }. Left unchecked, every rejected
    // send looked identical to a real one: the job queue marked it
    // COMPLETED and nothing ever surfaced the failure.
    const result = await resend.emails.send({
      from: requireFromEmail(),
      to: input.to,
      subject: input.subject,
      react: input.react,
      replyTo: input.replyTo,
    });

    if (result.error) {
      throw new Error(`Resend send failed (${result.error.name}): ${result.error.message}`);
    }
  }
}
