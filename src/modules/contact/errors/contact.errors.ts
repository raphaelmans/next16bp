import { BadGatewayError } from "@/shared/kernel/errors";

export class ContactMessageEmailError extends BadGatewayError {
  readonly code = "CONTACT_MESSAGE_EMAIL_FAILED";

  constructor(details?: Record<string, unknown>) {
    super("Unable to send contact message. Please try again later.", details);
  }
}
