import { appRoutes } from "@/common/app-routes";

export type ReservationLinkStatus =
  | "CREATED"
  | "AWAITING_PAYMENT"
  | "PAYMENT_MARKED_BY_USER"
  | "CONFIRMED"
  | "EXPIRED"
  | "CANCELLED";

export const PLAYER_RESERVATION_STEP_QUERY_PARAM = "step";
export const playerReservationSteps = ["payment"] as const;
export type PlayerReservationStep = (typeof playerReservationSteps)[number];

type GetPlayerReservationPathInput = {
  reservationId: string;
  status: ReservationLinkStatus | string;
};

type GetPlayerReservationAbsoluteUrlInput = GetPlayerReservationPathInput & {
  origin: string;
};

const PAYMENT_ROUTE_STATUSES = new Set<string>(["AWAITING_PAYMENT"]);

export function parsePlayerReservationStep(
  value?: string | null,
): PlayerReservationStep | undefined {
  return value === "payment" ? value : undefined;
}

export function getPlayerReservationDetailPath(input: {
  reservationId: string;
  step?: PlayerReservationStep | null;
}): string {
  const basePath = appRoutes.reservations.detail(input.reservationId);
  if (!input.step) return basePath;

  const params = new URLSearchParams({
    [PLAYER_RESERVATION_STEP_QUERY_PARAM]: input.step,
  });
  return `${basePath}?${params.toString()}`;
}

export function getPlayerReservationPaymentPath(reservationId: string): string {
  return getPlayerReservationDetailPath({
    reservationId,
    step: "payment",
  });
}

export function getPlayerReservationPath({
  reservationId,
  status,
}: GetPlayerReservationPathInput): string {
  const normalizedStatus = status.toUpperCase();

  if (PAYMENT_ROUTE_STATUSES.has(normalizedStatus)) {
    return getPlayerReservationPaymentPath(reservationId);
  }

  return appRoutes.reservations.detail(reservationId);
}

export function getPlayerReservationAbsoluteUrl({
  reservationId,
  status,
  origin,
}: GetPlayerReservationAbsoluteUrlInput): string {
  const path = getPlayerReservationPath({ reservationId, status });
  return new URL(path, origin).toString();
}

export function getPlayerReservationLoginRedirectPath({
  reservationId,
  status,
}: GetPlayerReservationPathInput): string {
  return appRoutes.login.from(
    getPlayerReservationPath({ reservationId, status }),
  );
}
