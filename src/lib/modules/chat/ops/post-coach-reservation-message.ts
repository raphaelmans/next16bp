import { appRoutes } from "@/common/app-routes";
import { env } from "@/lib/env";
import { makeChatProvider } from "../factories/chat.factory";
import { makeReservationChannelId } from "../helpers/reservation-channel-id";
import { ensureReservationThreadForReservation } from "./ensure-reservation-thread";

type CoachReservationMessageKind =
  | "created"
  | "payment_marked"
  | "confirmed"
  | "cancelled";

function buildAppLink(path: string) {
  const appUrl = env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
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
}

function buildCoachReservationMessage(
  kind: CoachReservationMessageKind,
  reservationId: string,
  reason?: string,
) {
  const reservationUrl = buildAppLink(
    appRoutes.reservations.detail(reservationId),
  );

  switch (kind) {
    case "created":
      return [
        "[SYSTEM GENERATED] Coach session request submitted. Coach review is in progress.",
        "",
        `- [View your reservation](${reservationUrl})`,
      ].join("\n");
    case "payment_marked":
      return [
        "[SYSTEM GENERATED] Payment submitted by player. Coach review is in progress.",
        "",
        `- [View your reservation](${reservationUrl})`,
      ].join("\n");
    case "confirmed":
      return [
        "[SYSTEM GENERATED] Your coach session is confirmed. Use this thread if you need anything before the session starts.",
        "",
        `- [View your reservation](${reservationUrl})`,
      ].join("\n");
    case "cancelled":
      return [
        `[SYSTEM GENERATED] Your coach session has been cancelled by the coach.${reason ? ` Reason: ${reason}.` : ""}`,
        "",
        `- [View your reservation](${reservationUrl})`,
      ].join("\n");
  }
}

function makeCoachReservationMessageId(
  reservationId: string,
  kind: CoachReservationMessageKind,
) {
  return `reservation:${reservationId}:coach-${kind}:v1`;
}

export async function postCoachReservationMessage(input: {
  reservationId: string;
  playerUserId: string;
  coachUserId: string;
  kind: CoachReservationMessageKind;
  reason?: string;
}) {
  const provider = makeChatProvider();
  const channelId = makeReservationChannelId(input.reservationId);

  await ensureReservationThreadForReservation({
    reservationId: input.reservationId,
    memberIds: [input.playerUserId, input.coachUserId],
    createdByUserId:
      input.kind === "created" || input.kind === "payment_marked"
        ? input.playerUserId
        : input.coachUserId,
  });

  await provider.sendReservationMessage({
    reservationId: input.reservationId,
    channelId,
    createdById:
      input.kind === "created" || input.kind === "payment_marked"
        ? input.playerUserId
        : input.coachUserId,
    text: buildCoachReservationMessage(
      input.kind,
      input.reservationId,
      input.reason,
    ),
    messageId: makeCoachReservationMessageId(input.reservationId, input.kind),
  });
}
