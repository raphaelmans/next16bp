import { getContainer } from "@/lib/shared/infra/container";
import { makeChatProvider } from "../factories/chat.factory";
import { makeReservationChannelId } from "../helpers/reservation-channel-id";
import { ReservationChatThreadRepository } from "../repositories/reservation-chat-thread.repository";

let reservationChatThreadRepository: ReservationChatThreadRepository | null =
  null;

function getReservationChatThreadRepository() {
  if (!reservationChatThreadRepository) {
    reservationChatThreadRepository = new ReservationChatThreadRepository(
      getContainer().db,
    );
  }
  return reservationChatThreadRepository;
}

export async function ensureReservationThreadForReservation(input: {
  reservationId: string;
  memberIds: string[];
  createdByUserId: string;
}) {
  const provider = makeChatProvider();
  const channelType = "messaging";
  const channelId = makeReservationChannelId(input.reservationId);

  await provider.ensureUsers(input.memberIds.map((id) => ({ id })));
  await provider.ensureReservationChannel({
    reservationId: input.reservationId,
    channelId,
    createdById: input.createdByUserId,
    memberIds: input.memberIds,
  });

  await getReservationChatThreadRepository().upsert({
    reservationId: input.reservationId,
    providerId: provider.providerId,
    providerChannelType: channelType,
    providerChannelId: channelId,
    createdByUserId: input.createdByUserId,
  });
}
