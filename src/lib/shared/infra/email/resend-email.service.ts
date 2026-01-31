import { Resend } from "resend";
import { env } from "@/lib/env";
import type { EmailPayload, EmailServiceStrategy } from "./email-service";

export class ResendEmailService implements EmailServiceStrategy {
  private readonly client: Resend;

  constructor() {
    this.client = new Resend(env.RESEND_API_KEY);
  }

  async sendEmail(payload: EmailPayload): Promise<{ id: string }> {
    const { data, error } = await this.client.emails.send({
      from: payload.from,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
      replyTo: payload.replyTo,
      headers: payload.headers,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data?.id) {
      throw new Error("Resend did not return a message id");
    }

    return { id: data.id };
  }
}
