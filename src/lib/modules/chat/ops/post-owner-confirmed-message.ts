import { appRoutes } from "@/common/app-routes";
import { env } from "@/lib/env";
import { makeChatProvider } from "../factories/chat.factory";
import { makeReservationChannelId } from "../helpers/reservation-channel-id";
import { ensureReservationThreadForReservation } from "./ensure-reservation-thread";

function buildOwnerConfirmedMessage(reservationId: string) {
  const appUrl = env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
  const playerReservationPath = appRoutes.reservations.detail(reservationId);
  const ownerReservationsPath = appRoutes.owner.reservations;
  const playerReservationUrl = appUrl
    ? `${appUrl}${playerReservationPath}`
    : playerReservationPath;
  const ownerReservationsUrl = appUrl
    ? `${appUrl}${ownerReservationsPath}`
    : ownerReservationsPath;

  return [
    "Your reservation is confirmed. If you need anything before your schedule, message us here.",
    `Player reservation: ${playerReservationUrl}`,
    `Owner reservations: ${ownerReservationsUrl}`,
  ].join("\n");
}

function makeOwnerConfirmedMessageId(reservationId: string) {
  return `reservation:${reservationId}:owner-confirmed:v1`;
}

export async function postOwnerConfirmedMessage(input: {
  reservationId: string;
  ownerUserId: string;
  playerUserId: string;
  messageText?: string;
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
    text: input.messageText ?? buildOwnerConfirmedMessage(input.reservationId),
    messageId: makeOwnerConfirmedMessageId(input.reservationId),
  });
}
