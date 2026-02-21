import {
  parseSupportThreadId,
  type SupportThreadKind,
} from "@/lib/modules/chat/shared/domain";

export type { SupportThreadKind };

export type ReservationThreadMetaDomainInput = {
  status: string;
  updatedAtIso?: string | null;
  startTimeIso: string;
  endTimeIso: string;
};

export function parseTimestampMs(value: unknown): number {
  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? value.getTime() : 0;
  }

  if (typeof value === "string") {
    const ms = new Date(value).getTime();
    return Number.isFinite(ms) ? ms : 0;
  }

  return 0;
}

export function isReservationMetaArchived(
  meta: ReservationThreadMetaDomainInput | null,
  now: Date,
): boolean {
  if (!meta) {
    return false;
  }

  if (meta.status === "CANCELLED" || meta.status === "EXPIRED") {
    return true;
  }

  if (meta.status === "CONFIRMED") {
    return new Date(meta.endTimeIso) < now;
  }

  return false;
}

export function getReservationReadOnlyReason(
  meta: ReservationThreadMetaDomainInput | null,
  now: Date,
): string | null {
  if (!meta) {
    return null;
  }

  if (meta.status === "CANCELLED") {
    return "Reservation cancelled. This conversation is archived and read-only.";
  }

  if (meta.status === "EXPIRED") {
    return "Reservation expired. This conversation is archived and read-only.";
  }

  if (meta.status === "CONFIRMED" && new Date(meta.endTimeIso) < now) {
    return "Reservation complete. This conversation is archived and read-only.";
  }

  return null;
}

export function sortReservationInboxIds(input: {
  reservationIds: readonly string[];
  metasByReservationId: ReadonlyMap<string, ReservationThreadMetaDomainInput>;
  unreadByReservationId: ReadonlyMap<string, number>;
  channelActivityMsByReservationId: ReadonlyMap<string, number>;
}): string[] {
  const {
    reservationIds,
    metasByReservationId,
    unreadByReservationId,
    channelActivityMsByReservationId,
  } = input;

  return [...reservationIds].sort((a, b) => {
    const aMeta = metasByReservationId.get(a) ?? null;
    const bMeta = metasByReservationId.get(b) ?? null;

    const aActivityMs = Math.max(
      channelActivityMsByReservationId.get(a) ?? 0,
      parseTimestampMs(aMeta?.updatedAtIso),
    );
    const bActivityMs = Math.max(
      channelActivityMsByReservationId.get(b) ?? 0,
      parseTimestampMs(bMeta?.updatedAtIso),
    );

    if (aActivityMs !== bActivityMs) {
      return bActivityMs - aActivityMs;
    }

    const aUnread = unreadByReservationId.get(a) ?? 0;
    const bUnread = unreadByReservationId.get(b) ?? 0;
    if (aUnread !== bUnread) {
      return bUnread - aUnread;
    }

    const aStartMs = parseTimestampMs(aMeta?.startTimeIso);
    const bStartMs = parseTimestampMs(bMeta?.startTimeIso);
    if (aStartMs !== bStartMs) {
      return bStartMs - aStartMs;
    }

    return a.localeCompare(b);
  });
}

export function getSupportThreadKind(
  channelId: string | null | undefined,
): SupportThreadKind | null {
  if (!channelId) {
    return null;
  }

  return parseSupportThreadId(channelId)?.supportKind ?? null;
}

export function getSupportThreadRequestId(
  channelId: string | null | undefined,
): string | null {
  if (!channelId) {
    return null;
  }

  return parseSupportThreadId(channelId)?.requestId ?? null;
}

export function formatSupportThreadTitle(channelId: string): string {
  const parsed = parseSupportThreadId(channelId);
  if (!parsed) {
    return "Support thread";
  }

  const short = parsed.requestId.slice(0, 8).toUpperCase();
  return parsed.supportKind === "claim"
    ? `Claim • CR-${short}`
    : `Verification • VR-${short}`;
}

export function isReservationStatusChatEnabled(status: string): boolean {
  return [
    "CREATED",
    "AWAITING_PAYMENT",
    "PAYMENT_MARKED_BY_USER",
    "CONFIRMED",
  ].includes(status);
}

export function getPlayerReservationStatusLabel(status: string): string {
  if (status === "CREATED") {
    return "Waiting for owner confirmation";
  }

  if (status === "AWAITING_PAYMENT") {
    return "Owner accepted - awaiting payment";
  }

  if (status === "PAYMENT_MARKED_BY_USER") {
    return "Payment marked - awaiting owner review";
  }

  return "Confirmed";
}

export function getChatStatusBadgeClassName(
  status: string | null | undefined,
): string {
  if (status === "CONFIRMED") {
    return "bg-success/10 text-success border-success/20";
  }

  if (status === "CANCELLED" || status === "EXPIRED") {
    return "bg-destructive/10 text-destructive border-destructive/20";
  }

  return "bg-warning/10 text-warning border-warning/20";
}
