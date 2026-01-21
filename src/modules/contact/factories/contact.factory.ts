import { makeEmailService } from "@/shared/infra/email/email.factory";
import { getContainer } from "@/shared/infra/container";
import { ContactMessageRepository } from "../repositories/contact-message.repository";
import { ContactService } from "../services/contact.service";

let contactMessageRepository: ContactMessageRepository | null = null;
let contactService: ContactService | null = null;

export function makeContactMessageRepository(): ContactMessageRepository {
  if (!contactMessageRepository) {
    contactMessageRepository = new ContactMessageRepository(getContainer().db);
  }
  return contactMessageRepository;
}

export function makeContactService(): ContactService {
  if (!contactService) {
    contactService = new ContactService(
      makeContactMessageRepository(),
      makeEmailService(),
      getContainer().transactionManager,
    );
  }
  return contactService;
}
