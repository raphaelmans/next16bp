export const RESERVATION_THREAD_PREFIX = "res-";
export const RESERVATION_GROUP_THREAD_PREFIX = "grp-";
export const SUPPORT_CLAIM_THREAD_PREFIX = "cr-";
export const SUPPORT_VERIFICATION_THREAD_PREFIX = "vr-";

export const SYSTEM_RESERVATION_MESSAGE_ID_SUFFIXES = [
  ":player-created:v1",
  ":player-payment-marked:v1",
  ":owner-confirmed:v1",
] as const;

export type SupportThreadKind = "claim" | "verification";
export type InboxThreadKind = "reservation" | "support";

export type ParsedReservationThreadId = {
  threadId: string;
  reservationId: string;
};

export type ParsedReservationGroupThreadId = {
  threadId: string;
  reservationGroupId: string;
};

export type ParsedReservationThreadRef =
  | ParsedReservationThreadId
  | ParsedReservationGroupThreadId;

export type ParsedSupportThreadId = {
  threadId: string;
  supportKind: SupportThreadKind;
  requestId: string;
};

export type ParsedInboxThreadRef =
  | ({ threadKind: "reservation" } & ParsedReservationThreadRef)
  | ({ threadKind: "support" } & ParsedSupportThreadId);

function parseWithPrefix(
  threadId: string,
  prefix: string,
  key: "reservationId" | "requestId",
): { threadId: string; reservationId?: string; requestId?: string } | null {
  if (!threadId.startsWith(prefix)) {
    return null;
  }

  const value = threadId.slice(prefix.length);
  if (!value) {
    return null;
  }

  if (key === "reservationId") {
    return { threadId, reservationId: value };
  }

  return { threadId, requestId: value };
}

export function makeReservationThreadId(reservationId: string): string {
  return `${RESERVATION_THREAD_PREFIX}${reservationId}`;
}

export function makeReservationGroupThreadId(
  reservationGroupId: string,
): string {
  return `${RESERVATION_GROUP_THREAD_PREFIX}${reservationGroupId}`;
}

export function makeSupportClaimThreadId(claimRequestId: string): string {
  return `${SUPPORT_CLAIM_THREAD_PREFIX}${claimRequestId}`;
}

export function makeSupportVerificationThreadId(
  placeVerificationRequestId: string,
): string {
  return `${SUPPORT_VERIFICATION_THREAD_PREFIX}${placeVerificationRequestId}`;
}

export function parseReservationThreadId(
  threadId: string,
): ParsedReservationThreadId | null {
  const parsed = parseWithPrefix(
    threadId,
    RESERVATION_THREAD_PREFIX,
    "reservationId",
  );

  if (!parsed?.reservationId) {
    return null;
  }

  return {
    threadId: parsed.threadId,
    reservationId: parsed.reservationId,
  };
}

export function parseSupportThreadId(
  threadId: string,
): ParsedSupportThreadId | null {
  const claimParsed = parseWithPrefix(
    threadId,
    SUPPORT_CLAIM_THREAD_PREFIX,
    "requestId",
  );
  if (claimParsed?.requestId) {
    return {
      threadId: claimParsed.threadId,
      supportKind: "claim",
      requestId: claimParsed.requestId,
    };
  }

  const verificationParsed = parseWithPrefix(
    threadId,
    SUPPORT_VERIFICATION_THREAD_PREFIX,
    "requestId",
  );
  if (verificationParsed?.requestId) {
    return {
      threadId: verificationParsed.threadId,
      supportKind: "verification",
      requestId: verificationParsed.requestId,
    };
  }

  return null;
}

export function parseReservationGroupThreadId(
  threadId: string,
): ParsedReservationGroupThreadId | null {
  const parsed = parseWithPrefix(
    threadId,
    RESERVATION_GROUP_THREAD_PREFIX,
    "requestId",
  );

  if (!parsed?.requestId) {
    return null;
  }

  return {
    threadId: parsed.threadId,
    reservationGroupId: parsed.requestId,
  };
}

export function parseInboxThreadRef(
  threadKind: InboxThreadKind,
  threadId: string,
): ParsedInboxThreadRef | null {
  if (threadKind === "reservation") {
    const parsedReservation = parseReservationThreadId(threadId);
    if (parsedReservation) {
      return { threadKind, ...parsedReservation };
    }

    const parsedReservationGroup = parseReservationGroupThreadId(threadId);
    if (parsedReservationGroup) {
      return { threadKind, ...parsedReservationGroup };
    }

    return null;
  }

  const parsedSupport = parseSupportThreadId(threadId);
  if (!parsedSupport) {
    return null;
  }

  return { threadKind, ...parsedSupport };
}

export function isSystemReservationMessageId(
  messageId: string | null | undefined,
): boolean {
  if (!messageId) {
    return false;
  }

  return SYSTEM_RESERVATION_MESSAGE_ID_SUFFIXES.some((suffix) =>
    messageId.endsWith(suffix),
  );
}
