import { getContainer } from "@/lib/shared/infra/container";
import { OpenPlayRepository } from "../repositories/open-play.repository";
import { OpenPlayParticipantRepository } from "../repositories/open-play-participant.repository";
import { OpenPlayService } from "../services/open-play.service";

let openPlayRepository: OpenPlayRepository | null = null;
let openPlayParticipantRepository: OpenPlayParticipantRepository | null = null;
let openPlayService: OpenPlayService | null = null;

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

export function makeOpenPlayService() {
  if (!openPlayService) {
    openPlayService = new OpenPlayService(
      makeOpenPlayRepository(),
      makeOpenPlayParticipantRepository(),
      getContainer().transactionManager,
    );
  }
  return openPlayService;
}
