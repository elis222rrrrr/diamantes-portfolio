import "server-only";

export type SendEmailInput = {
  to: string;
  subject: string;
  react: React.ReactElement;
  replyTo?: string;
};

export interface EmailSender {
  send(input: SendEmailInput): Promise<void>;
}
