import { makeCourtRepository } from "@/lib/modules/court/factories/court.factory";
import { makeOrganizationRepository } from "@/lib/modules/organization/factories/organization.factory";
import { makePlaceRepository } from "@/lib/modules/place/factories/place.factory";
import { makeProfileRepository } from "@/lib/modules/profile/factories/profile.factory";
import { makeReservationRepository } from "@/lib/modules/reservation/factories/reservation.factory";
import { getContainer } from "@/lib/shared/infra/container";
import { ChatMessageRepository } from "../repositories/chat-message.repository";
import { ReservationChatThreadRepository } from "../repositories/reservation-chat-thread.repository";
import { ReservationChatTranscriptRepository } from "../repositories/reservation-chat-transcript.repository";
import { ReservationChatService } from "../services/reservation-chat.service";
import { makeChatProvider } from "./chat.factory";

let reservationChatThreadRepository: ReservationChatThreadRepository | null =
  null;
let reservationChatTranscriptRepository: ReservationChatTranscriptRepository | null =
  null;
let chatMessageRepository: ChatMessageRepository | null = null;
let reservationChatService: ReservationChatService | null = null;

export function makeReservationChatThreadRepository(): ReservationChatThreadRepository {
  if (!reservationChatThreadRepository) {
    reservationChatThreadRepository = new ReservationChatThreadRepository(
      getContainer().db,
    );
  }
  return reservationChatThreadRepository;
}

export function makeReservationChatTranscriptRepository(): ReservationChatTranscriptRepository {
  if (!reservationChatTranscriptRepository) {
    reservationChatTranscriptRepository =
      new ReservationChatTranscriptRepository(getContainer().db);
  }
  return reservationChatTranscriptRepository;
}

export function makeChatMessageRepository(): ChatMessageRepository {
  if (!chatMessageRepository) {
    chatMessageRepository = new ChatMessageRepository(getContainer().db);
  }
  return chatMessageRepository;
}

export function makeReservationChatService(): ReservationChatService {
  if (!reservationChatService) {
    reservationChatService = new ReservationChatService(
      makeReservationRepository(),
      makeProfileRepository(),
      makeCourtRepository(),
      makePlaceRepository(),
      makeOrganizationRepository(),
      makeReservationChatThreadRepository(),
      makeReservationChatTranscriptRepository(),
      makeChatProvider(),
    );
  }

  return reservationChatService;
}
