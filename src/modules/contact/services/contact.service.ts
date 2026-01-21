import { env } from "@/lib/env";
import type { EmailServiceStrategy } from "@/shared/infra/email/email-service";
import { logger } from "@/shared/infra/logger";
import type { RequestContext } from "@/shared/kernel/context";
import type { TransactionManager } from "@/shared/kernel/transaction";
import type { SubmitContactMessageDTO } from "../dtos";
import { ContactMessageEmailError } from "../errors/contact.errors";
import type { IContactMessageRepository } from "../repositories/contact-message.repository";

export interface ContactSubmissionContext extends RequestContext {
  userId?: string | null;
}

export interface IContactService {
  submitContactMessage(
    data: SubmitContactMessageDTO,
    ctx?: ContactSubmissionContext,
  ): Promise<{ id: string; submittedAt: Date }>;
}

export class ContactService implements IContactService {
  constructor(
    private contactMessageRepository: IContactMessageRepository,
    private emailService: EmailServiceStrategy,
    private transactionManager: TransactionManager,
  ) {}

  async submitContactMessage(
    data: SubmitContactMessageDTO,
    ctx?: ContactSubmissionContext,
  ): Promise<{ id: string; submittedAt: Date }> {
    const contactMessage = await this.transactionManager.run(async (tx) => {
      const txCtx: RequestContext = { requestId: ctx?.requestId, tx };
      return this.contactMessageRepository.create(
        {
          name: data.name,
          email: data.email,
          subject: data.subject,
          message: data.message,
          userId: ctx?.userId ?? null,
          requestId: ctx?.requestId,
        },
        txCtx,
      );
    });

    try {
      const emailText = [
        "New contact inquiry",
        "",
        `Name: ${data.name}`,
        `Email: ${data.email}`,
        `Subject: ${data.subject}`,
        "",
        "Message:",
        data.message,
      ].join("\n");

      const result = await this.emailService.sendEmail({
        from: env.CONTACT_US_FROM_EMAIL,
        to: env.CONTACT_US_TO_EMAIL,
        subject: `Contact us: ${data.subject}`,
        text: emailText,
        replyTo: data.email,
        headers: {
          "Idempotency-Key": contactMessage.id,
        },
      });

      await this.transactionManager.run(async (tx) => {
        await this.contactMessageRepository.update(
          contactMessage.id,
          {
            resendEmailId: result.id,
            emailSentAt: new Date(),
          },
          { tx },
        );
      });

      logger.info(
        {
          event: "contact_message.submitted",
          contactMessageId: contactMessage.id,
          resendEmailId: result.id,
          requestId: ctx?.requestId,
        },
        "Contact message submitted",
      );

      return { id: contactMessage.id, submittedAt: contactMessage.createdAt };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unable to send email";
      const errorDetails =
        error instanceof Error ? error : new Error(errorMessage);

      await this.transactionManager.run(async (tx) => {
        await this.contactMessageRepository.update(
          contactMessage.id,
          {
            emailFailedAt: new Date(),
            emailError: errorMessage,
          },
          { tx },
        );
      });

      logger.error(
        {
          event: "contact_message.email_failed",
          contactMessageId: contactMessage.id,
          requestId: ctx?.requestId,
          err: errorDetails,
        },
        "Contact message email failed",
      );

      throw new ContactMessageEmailError({
        contactMessageId: contactMessage.id,
      });
    }
  }
}
