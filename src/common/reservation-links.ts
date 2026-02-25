import { appRoutes } from "@/common/app-routes";

export type ReservationLinkStatus =
  | "CREATED"
  | "AWAITING_PAYMENT"
  | "PAYMENT_MARKED_BY_USER"
  | "CONFIRMED"
  | "EXPIRED"
  | "CANCELLED";

type GetPlayerReservationPathInput = {
  reservationId: string;
  status: ReservationLinkStatus | string;
};

type GetPlayerReservationAbsoluteUrlInput = GetPlayerReservationPathInput & {
  origin: string;
};

const PAYMENT_ROUTE_STATUSES = new Set<string>(["AWAITING_PAYMENT"]);

export function getPlayerReservationPath({
  reservationId,
  status,
}: GetPlayerReservationPathInput): string {
  const normalizedStatus = status.toUpperCase();

  if (PAYMENT_ROUTE_STATUSES.has(normalizedStatus)) {
    return appRoutes.reservations.payment(reservationId);
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
