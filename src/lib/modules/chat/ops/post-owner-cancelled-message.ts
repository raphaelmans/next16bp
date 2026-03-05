import { appRoutes } from "@/common/app-routes";
import { env } from "@/lib/env";
import { makeChatProvider } from "../factories/chat.factory";
import { makeReservationChannelId } from "../helpers/reservation-channel-id";
import { ensureReservationThreadForReservation } from "./ensure-reservation-thread";

function buildOwnerCancelledMessage(reservationId: string, reason: string) {
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

  return [
    `[SYSTEM GENERATED] Your reservation has been cancelled by the venue. Reason: ${reason}. If you have questions, message us here.`,
    "",
    `- [View your reservation](${playerReservationUrl})`,
  ].join("\n");
}

function makeOwnerCancelledMessageId(reservationId: string) {
  return `reservation:${reservationId}:owner-cancelled:v1`;
}

export async function postOwnerCancelledMessage(input: {
  reservationId: string;
  ownerUserId: string;
  playerUserId: string;
  reason: string;
}) {
  const provider = makeChatProvider();
  const channelId = makeReservationChannelId(input.reservationId);

  await ensureReservationThreadForReservation({
    reservationId: input.reservationId,
    memberIds: [input.playerUserId, input.ownerUserId],
    createdByUserId: input.ownerUserId,
  });

  await provider.sendReservationMessage({
    reservationId: input.reservationId,
    channelId,
    createdById: input.ownerUserId,
    text: buildOwnerCancelledMessage(input.reservationId, input.reason),
    messageId: makeOwnerCancelledMessageId(input.reservationId),
  });
}
