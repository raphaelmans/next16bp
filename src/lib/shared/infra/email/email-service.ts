export type EmailPayload = {
  from: string;
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string | string[];
  headers?: Record<string, string>;
};

/**
 * Strategy interface for email delivery providers.
 */
export interface EmailServiceStrategy {
  sendEmail(payload: EmailPayload): Promise<{ id: string }>;
}
