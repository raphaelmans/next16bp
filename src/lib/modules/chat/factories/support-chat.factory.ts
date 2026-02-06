import { makeClaimRequestRepository } from "@/lib/modules/claim-request/factories/claim-request.factory";
import { makePlaceRepository } from "@/lib/modules/place/factories/place.factory";
import { makePlaceVerificationRequestRepository } from "@/lib/modules/place-verification/factories/place-verification.factory";
import { getContainer } from "@/lib/shared/infra/container";
import { SupportChatThreadRepository } from "../repositories/support-chat-thread.repository";
import { SupportChatService } from "../services/support-chat.service";
import { makeChatProvider } from "./chat.factory";

let supportChatThreadRepository: SupportChatThreadRepository | null = null;
let supportChatService: SupportChatService | null = null;

export function makeSupportChatThreadRepository() {
  if (!supportChatThreadRepository) {
    supportChatThreadRepository = new SupportChatThreadRepository(
      getContainer().db,
    );
  }
  return supportChatThreadRepository;
}

export function makeSupportChatService() {
  if (!supportChatService) {
    supportChatService = new SupportChatService(
      makeClaimRequestRepository(),
      makePlaceVerificationRequestRepository(),
      makePlaceRepository(),
      makeSupportChatThreadRepository(),
      makeChatProvider(),
    );
  }
  return supportChatService;
}
