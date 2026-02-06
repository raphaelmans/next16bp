import { appRoutes } from "@/common/app-routes";
import { env } from "@/lib/env";
import { makeChatProvider } from "../factories/chat.factory";
import { makeReservationChannelId } from "../helpers/reservation-channel-id";
import { ensureReservationThreadForReservation } from "./ensure-reservation-thread";

function buildPlayerCreatedMessage(reservationId: string) {
  const appUrl = env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";

  const buildAppLink = (path: string) => {
    if (!appUrl) {
      return path;
    }

    try {
      const baseUrl = new URL(appUrl);
      if (baseUrl.protocol !== "https:" && baseUrl.protocol !== "http:") {
        return path;
      }
      return new URL(path, baseUrl).toString();
    } catch {
      return path;
    }
  };

  const playerReservationPath = appRoutes.reservations.detail(reservationId);
  const playerReservationUrl = buildAppLink(playerReservationPath);

  return `[SYSTEM GENERATED] Reservation request submitted. You can review details here: [View reservation](${playerReservationUrl})`;
}

function makePlayerCreatedMessageId(reservationId: string) {
  return `reservation:${reservationId}:player-created:v1`;
}

export async function postPlayerCreatedMessage(input: {
  reservationId: string;
  playerUserId: string;
  ownerUserId: string;
  messageText?: string;
}) {
  const provider = makeChatProvider();
  const channelId = makeReservationChannelId(input.reservationId);

  await ensureReservationThreadForReservation({
    reservationId: input.reservationId,
    memberIds: [input.playerUserId, input.ownerUserId],
    createdByUserId: input.playerUserId,
  });

  await provider.sendReservationMessage({
    reservationId: input.reservationId,
    channelId,
    createdById: input.playerUserId,
    text: input.messageText ?? buildPlayerCreatedMessage(input.reservationId),
    messageId: makePlayerCreatedMessageId(input.reservationId),
  });
}
