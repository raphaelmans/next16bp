import { OpenPlayRepository } from "@/lib/modules/open-play/repositories/open-play.repository";
import { OpenPlayParticipantRepository } from "@/lib/modules/open-play/repositories/open-play-participant.repository";
import { getContainer } from "@/lib/shared/infra/container";
import { OpenPlayChatThreadRepository } from "../repositories/open-play-chat-thread.repository";
import { OpenPlayChatService } from "../services/open-play-chat.service";
import { makeChatProvider } from "./chat.factory";

let openPlayRepository: OpenPlayRepository | null = null;
let openPlayParticipantRepository: OpenPlayParticipantRepository | null = null;
let openPlayChatThreadRepository: OpenPlayChatThreadRepository | null = null;
let openPlayChatService: OpenPlayChatService | null = null;

export function makeOpenPlayRepository() {
  if (!openPlayRepository) {
    openPlayRepository = new OpenPlayRepository(getContainer().db);
  }
  return openPlayRepository;
}

export function makeOpenPlayParticipantRepository() {
  if (!openPlayParticipantRepository) {
    openPlayParticipantRepository = new OpenPlayParticipantRepository(
      getContainer().db,
    );
  }
  return openPlayParticipantRepository;
}

export function makeOpenPlayChatThreadRepository() {
  if (!openPlayChatThreadRepository) {
    openPlayChatThreadRepository = new OpenPlayChatThreadRepository(
      getContainer().db,
    );
  }
  return openPlayChatThreadRepository;
}

export function makeOpenPlayChatService() {
  if (!openPlayChatService) {
    openPlayChatService = new OpenPlayChatService(
      makeOpenPlayRepository(),
      makeOpenPlayParticipantRepository(),
      makeOpenPlayChatThreadRepository(),
      makeChatProvider(),
    );
  }
  return openPlayChatService;
}
