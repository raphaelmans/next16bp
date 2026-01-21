import type { EmailServiceStrategy } from "./email-service";
import { ResendEmailService } from "./resend-email.service";

let emailService: EmailServiceStrategy | null = null;

export function makeEmailService(): EmailServiceStrategy {
  if (!emailService) {
    emailService = new ResendEmailService();
  }
  return emailService;
}
