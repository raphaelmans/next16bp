import { makeOrganizationMemberService } from "@/lib/modules/organization-member/factories/organization-member.factory";
import { getContainer } from "@/lib/shared/infra/container";
import { ChatInboxArchiveRepository } from "../repositories/chat-inbox-archive.repository";
import { ChatInboxService } from "../services/chat-inbox.service";

let chatInboxArchiveRepository: ChatInboxArchiveRepository | null = null;
let chatInboxService: ChatInboxService | null = null;

export function makeChatInboxArchiveRepository() {
  if (!chatInboxArchiveRepository) {
    chatInboxArchiveRepository = new ChatInboxArchiveRepository(
      getContainer().db,
    );
  }

  return chatInboxArchiveRepository;
}

export function makeChatInboxService() {
  if (!chatInboxService) {
    chatInboxService = new ChatInboxService(
      getContainer().db,
      makeChatInboxArchiveRepository(),
      makeOrganizationMemberService(),
    );
  }

  return chatInboxService;
}
