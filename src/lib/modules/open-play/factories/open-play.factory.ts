import { getContainer } from "@/lib/shared/infra/container";
import { ExternalOpenPlayRepository } from "../repositories/external-open-play.repository";
import { ExternalOpenPlayParticipantRepository } from "../repositories/external-open-play-participant.repository";
import { ExternalOpenPlayReportRepository } from "../repositories/external-open-play-report.repository";
import { OpenPlayRepository } from "../repositories/open-play.repository";
import { OpenPlayParticipantRepository } from "../repositories/open-play-participant.repository";
import { ExternalOpenPlayService } from "../services/external-open-play.service";
import { OpenPlayService } from "../services/open-play.service";

let openPlayRepository: OpenPlayRepository | null = null;
let openPlayParticipantRepository: OpenPlayParticipantRepository | null = null;
let openPlayService: OpenPlayService | null = null;
let externalOpenPlayRepository: ExternalOpenPlayRepository | null = null;
let externalOpenPlayParticipantRepository: ExternalOpenPlayParticipantRepository | null =
  null;
let externalOpenPlayReportRepository: ExternalOpenPlayReportRepository | null =
  null;
let externalOpenPlayService: ExternalOpenPlayService | null = null;

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

export function makeExternalOpenPlayRepository() {
  if (!externalOpenPlayRepository) {
    externalOpenPlayRepository = new ExternalOpenPlayRepository(
      getContainer().db,
    );
  }
  return externalOpenPlayRepository;
}

export function makeExternalOpenPlayParticipantRepository() {
  if (!externalOpenPlayParticipantRepository) {
    externalOpenPlayParticipantRepository =
      new ExternalOpenPlayParticipantRepository(getContainer().db);
  }
  return externalOpenPlayParticipantRepository;
}

export function makeExternalOpenPlayReportRepository() {
  if (!externalOpenPlayReportRepository) {
    externalOpenPlayReportRepository = new ExternalOpenPlayReportRepository(
      getContainer().db,
    );
  }
  return externalOpenPlayReportRepository;
}

export function makeExternalOpenPlayService() {
  if (!externalOpenPlayService) {
    externalOpenPlayService = new ExternalOpenPlayService(
      makeExternalOpenPlayRepository(),
      makeExternalOpenPlayParticipantRepository(),
      makeExternalOpenPlayReportRepository(),
      makeOpenPlayService(),
      makeOpenPlayParticipantRepository(),
      getContainer().transactionManager,
    );
  }
  return externalOpenPlayService;
}
