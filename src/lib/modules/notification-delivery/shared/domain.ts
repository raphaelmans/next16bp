import { appRoutes } from "@/common/app-routes";
import {
  formatCurrency,
  formatDateShort,
  formatTimeRange,
} from "@/common/format";
import { getPlayerReservationPath } from "@/common/reservation-links";
import {
  type ClaimReviewedPayload,
  type CoachBookingAwaitingPaymentPayload,
  type CoachBookingCancelledPayload,
  type CoachBookingConfirmedPayload,
  type CoachBookingCreatedPayload,
  type CoachBookingPaymentMarkedPayload,
  type CoachBookingRejectedPayload,
  claimReviewedSchema,
  coachBookingAwaitingPaymentSchema,
  coachBookingCancelledSchema,
  coachBookingConfirmedSchema,
  coachBookingCreatedSchema,
  coachBookingPaymentMarkedSchema,
  coachBookingRejectedSchema,
  type NotificationEventType,
  type ReservationAwaitingPaymentPayload,
  type ReservationCancelledByOwnerPayload,
  type ReservationCancelledPayload,
  type ReservationConfirmedPayload,
  type ReservationCreatedPayload,
  type ReservationGroupAwaitingPaymentPayload,
  type ReservationGroupCancelledByOwnerPayload,
  type ReservationGroupCancelledPayload,
  type ReservationGroupConfirmedPayload,
  type ReservationGroupCreatedPayload,
  type ReservationGroupPaymentMarkedPayload,
  type ReservationGroupRejectedPayload,
  type ReservationPaymentMarkedPayload,
  type ReservationPingOwnerPayload,
  type ReservationRejectedPayload,
  reservationAwaitingPaymentSchema,
  reservationCancelledByOwnerSchema,
  reservationCancelledSchema,
  reservationConfirmedSchema,
  reservationCreatedSchema,
  reservationGroupAwaitingPaymentSchema,
  reservationGroupCancelledByOwnerSchema,
  reservationGroupCancelledSchema,
  reservationGroupConfirmedSchema,
  reservationGroupCreatedSchema,
  reservationGroupPaymentMarkedSchema,
  reservationGroupRejectedSchema,
  reservationPaymentMarkedSchema,
  reservationPingOwnerSchema,
  reservationRejectedSchema,
  type TestWebPushPayload,
  testWebPushSchema,
  type VerificationRequestedPayload,
  type VerificationReviewedPayload,
  verificationRequestedSchema,
  verificationReviewedSchema,
} from "./schemas";

export type PushContent = {
  title: string;
  body: string | null;
  url: string | null;
  tag: string | null;
};

export type EmailTemplateData = {
  preheader: string;
  headerSubtitle: string;
  title: string;
  bodyLines: string[];
  ctaText?: string;
  ctaUrl?: string;
  statusBadge?: {
    label: string;
    color: "success" | "destructive" | "warning";
  };
  greeting?: string;
  detailRows?: { label: string; value: string }[];
  footerNote?: string;
  secondaryText?: string;
};

export type EmailContent = {
  subject: string;
  text: string;
  templateData: EmailTemplateData;
};

export type NotificationContent = {
  push: PushContent;
  email: EmailContent | null;
  smsText: string | null;
};

export type NotificationContentError = {
  error: "INVALID_PAYLOAD" | "UNSUPPORTED_EVENT_TYPE";
};

export const toLocalCurrency = (
  totalPriceCents: number,
  currency: string,
): string => {
  const amount = (totalPriceCents / 100).toFixed(2);
  return `${amount} ${currency}`;
};

const makeUrl = (appUrl: string, path: string): string =>
  appUrl ? `${appUrl}${path}` : path;

export function buildVerificationRequestedContent(
  payload: VerificationRequestedPayload,
  appUrl: string,
): NotificationContent {
  const reviewPath = appRoutes.admin.placeVerification.detail(
    payload.requestId,
  );
  const reviewUrl = makeUrl(appUrl, reviewPath);

  const subject = `Venue review needed: ${payload.placeName}`;

  const bodyNarrative = `${payload.placeName} has submitted a verification request and is waiting to go live.`;
  const notesLine = payload.requestNotes
    ? `Notes from owner: "${payload.requestNotes}"`
    : "";

  const emailText = [
    "Hi Admin,",
    "",
    "A venue is waiting for your review",
    "",
    bodyNarrative,
    ...(notesLine ? [notesLine] : []),
    "",
    `Venue: ${payload.placeName}`,
    ...(payload.organizationName
      ? [`Organization: ${payload.organizationName}`]
      : []),
    "",
    `Review: ${reviewUrl}`,
    "",
    "Approving this venue will make it visible to players on KudosCourts.",
  ].join("\n");

  const smsText = `KudosCourts: ${payload.placeName} needs verification review. Tap to review: ${reviewUrl}`;

  const detailRows: { label: string; value: string }[] = [
    { label: "Venue", value: payload.placeName },
  ];
  if (payload.organizationName) {
    detailRows.push({ label: "Organization", value: payload.organizationName });
  }

  return {
    push: {
      title: "New venue verification request",
      body: `${payload.placeName} needs review`,
      url: reviewPath,
      tag: `place_verification.requested:${payload.requestId}`,
    },
    email: {
      subject,
      text: emailText,
      templateData: {
        preheader: `${payload.placeName} submitted for verification. Review and approve to get them listed.`,
        headerSubtitle: "Verification Request",
        title: "A venue is waiting for your review",
        greeting: "Hi Admin,",
        bodyLines: [bodyNarrative, ...(notesLine ? ["", notesLine] : [])],
        detailRows,
        ctaText: "Review This Venue",
        ctaUrl: reviewUrl,
        footerNote:
          "Approving this venue will make it visible to players on KudosCourts.",
      },
    },
    smsText,
  };
}

export function buildReservationCreatedContent(
  payload: ReservationCreatedPayload,
  appUrl: string,
): NotificationContent {
  const reservationPath = appRoutes.organization.reservationDetail(
    payload.reservationId,
  );
  const reservationUrl = makeUrl(appUrl, reservationPath);

  const dateFormatted = formatDateShort(payload.startTimeIso);
  const timeFormatted = formatTimeRange(
    payload.startTimeIso,
    payload.endTimeIso,
  );
  const totalFormatted = formatCurrency(
    payload.totalPriceCents,
    payload.currency,
  );

  const subject = `New booking at ${payload.placeName}`;

  const emailText = [
    "Hi there,",
    "",
    "You have a new reservation!",
    "",
    `${payload.playerName} just booked a venue at ${payload.placeName}. Review the details below and respond to confirm.`,
    "",
    `Venue: ${payload.courtLabel}`,
    `Date: ${dateFormatted}`,
    `Time: ${timeFormatted}`,
    `Player: ${payload.playerName}`,
    ...(payload.playerEmail ? [`Email: ${payload.playerEmail}`] : []),
    ...(payload.playerPhone ? [`Phone: ${payload.playerPhone}`] : []),
    `Total: ${totalFormatted}`,
    "",
    `Review: ${reservationUrl}`,
    ...(payload.expiresAtIso
      ? [
          "",
          `Please respond by ${formatDateShort(payload.expiresAtIso)} to avoid automatic expiration.`,
        ]
      : []),
    "",
    "You can approve or reject this reservation from your dashboard.",
  ].join("\n");

  const smsText = `KudosCourts: ${payload.playerName} booked ${payload.courtLabel} at ${payload.placeName} on ${dateFormatted}. Review now: ${reservationUrl}`;

  const detailRows: { label: string; value: string }[] = [
    { label: "Venue", value: payload.courtLabel },
    { label: "Date", value: dateFormatted },
    { label: "Time", value: timeFormatted },
    { label: "Player", value: payload.playerName },
  ];
  if (payload.playerEmail) {
    detailRows.push({ label: "Email", value: payload.playerEmail });
  }
  if (payload.playerPhone) {
    detailRows.push({ label: "Phone", value: payload.playerPhone });
  }
  detailRows.push({ label: "Total", value: totalFormatted });

  return {
    push: {
      title: "New reservation",
      body: `${payload.placeName} (${payload.courtLabel})`,
      url: reservationPath,
      tag: `reservation.created:${payload.reservationId}`,
    },
    email: {
      subject,
      text: emailText,
      templateData: {
        preheader: `${payload.playerName} booked ${payload.courtLabel} for ${dateFormatted}. ${totalFormatted} total.`,
        headerSubtitle: "New Reservation",
        title: "You have a new reservation!",
        greeting: "Hi there,",
        bodyLines: [
          `${payload.playerName} just booked a venue at ${payload.placeName}. Review the details below and respond to confirm.`,
        ],
        detailRows,
        ctaText: "Review & Respond",
        ctaUrl: reservationUrl,
        footerNote: payload.expiresAtIso
          ? `Please respond by ${formatDateShort(payload.expiresAtIso)} to avoid automatic expiration.`
          : undefined,
        secondaryText:
          "You can approve or reject this reservation from your dashboard.",
      },
    },
    smsText,
  };
}

export function buildReservationGroupCreatedContent(
  payload: ReservationGroupCreatedPayload,
  appUrl: string,
): NotificationContent {
  const reservationPath = appRoutes.organization.reservationDetail(
    payload.representativeReservationId,
  );
  const reservationUrl = makeUrl(appUrl, reservationPath);

  const dateFormatted = formatDateShort(payload.startTimeIso);
  const timeFormatted = formatTimeRange(
    payload.startTimeIso,
    payload.endTimeIso,
  );
  const totalFormatted = formatCurrency(
    payload.totalPriceCents,
    payload.currency,
  );
  const courtsLabel = `${payload.itemCount} venue${payload.itemCount === 1 ? "" : "s"}`;

  const subject = `New group booking at ${payload.placeName}`;

  const emailText = [
    "Hi there,",
    "",
    `New group booking: ${courtsLabel}`,
    "",
    `${payload.playerName} just booked ${courtsLabel} at ${payload.placeName}. Review the details below and respond to confirm.`,
    "",
    `Venues: ${courtsLabel}`,
    `Date: ${dateFormatted}`,
    `Time: ${timeFormatted}`,
    `Player: ${payload.playerName}`,
    ...(payload.playerEmail ? [`Email: ${payload.playerEmail}`] : []),
    ...(payload.playerPhone ? [`Phone: ${payload.playerPhone}`] : []),
    `Total: ${totalFormatted}`,
    "",
    `Review: ${reservationUrl}`,
    ...(payload.expiresAtIso
      ? [
          "",
          `Please respond by ${formatDateShort(payload.expiresAtIso)} to avoid automatic expiration.`,
        ]
      : []),
    "",
    "You can approve or reject this group booking from your dashboard.",
  ].join("\n");

  const smsText = `KudosCourts: ${payload.playerName} booked ${courtsLabel} at ${payload.placeName} on ${dateFormatted}. Review now: ${reservationUrl}`;

  const detailRows: { label: string; value: string }[] = [
    { label: "Venues", value: courtsLabel },
    { label: "Date", value: dateFormatted },
    { label: "Time", value: timeFormatted },
    { label: "Player", value: payload.playerName },
  ];
  if (payload.playerEmail) {
    detailRows.push({ label: "Email", value: payload.playerEmail });
  }
  if (payload.playerPhone) {
    detailRows.push({ label: "Phone", value: payload.playerPhone });
  }
  detailRows.push({ label: "Total", value: totalFormatted });

  return {
    push: {
      title: "New booking group",
      body: `${payload.placeName} (${payload.itemCount} items)`,
      url: reservationPath,
      tag: `reservation_group.created:${payload.reservationGroupId}`,
    },
    email: {
      subject,
      text: emailText,
      templateData: {
        preheader: `${payload.playerName} booked ${courtsLabel} for ${dateFormatted}. ${totalFormatted} total.`,
        headerSubtitle: "New Group Booking",
        title: `New group booking: ${courtsLabel}`,
        greeting: "Hi there,",
        bodyLines: [
          `${payload.playerName} just booked ${courtsLabel} at ${payload.placeName}. Review the details below and respond to confirm.`,
        ],
        detailRows,
        ctaText: "Review Group Booking",
        ctaUrl: reservationUrl,
        footerNote: payload.expiresAtIso
          ? `Please respond by ${formatDateShort(payload.expiresAtIso)} to avoid automatic expiration.`
          : undefined,
        secondaryText:
          "You can approve or reject this group booking from your dashboard.",
      },
    },
    smsText,
  };
}

export function buildVerificationReviewedContent(
  payload: VerificationReviewedPayload,
  appUrl: string,
): NotificationContent {
  const verifyPath = appRoutes.organization.verification.place(payload.placeId);
  const verifyUrl = makeUrl(appUrl, verifyPath);
  const statusLabel = payload.status === "APPROVED" ? "approved" : "rejected";
  const isApproved = payload.status === "APPROVED";

  const subject = isApproved
    ? `Great news! ${payload.placeName} is verified`
    : `Action needed: ${payload.placeName} verification`;

  const approvedBody = `Congratulations! ${payload.placeName} has been verified and is now live on KudosCourts.`;
  const rejectedBody = payload.reviewNotes
    ? `We've reviewed ${payload.placeName} and it needs a few updates before it can go live. Here's the feedback:\n\n"${payload.reviewNotes}"\n\nPlease make the requested changes and resubmit for review.`
    : `We've reviewed ${payload.placeName} and it needs a few updates before it can go live. Please check the details and resubmit for review.`;

  const emailText = [
    "Hi there,",
    "",
    isApproved
      ? "Your venue has been verified!"
      : "Your venue needs a few updates",
    "",
    isApproved ? approvedBody : rejectedBody,
    "",
    `Details: ${verifyUrl}`,
    "",
    isApproved
      ? "Players can now discover and book your venue."
      : "We're looking forward to getting your venue listed!",
  ].join("\n");

  const smsText = isApproved
    ? `KudosCourts: ${payload.placeName} is now verified! Players can find and book your venue.`
    : `KudosCourts: ${payload.placeName} verification needs updates. Log in to review the feedback.`;

  return {
    push: {
      title: `Verification ${statusLabel}`,
      body: payload.placeName,
      url: verifyPath,
      tag: `place_verification.${statusLabel}:${payload.requestId}`,
    },
    email: {
      subject,
      text: emailText,
      templateData: {
        preheader: isApproved
          ? `${payload.placeName} is verified and live on KudosCourts!`
          : `${payload.placeName} needs a few updates before going live.`,
        headerSubtitle: "Venue Verification",
        title: isApproved
          ? "Your venue has been verified!"
          : "Your venue needs a few updates",
        greeting: "Hi there,",
        statusBadge: {
          label: isApproved ? "Verified" : "Updates Needed",
          color: isApproved ? "success" : "warning",
        },
        bodyLines: isApproved
          ? [approvedBody]
          : [
              `We've reviewed ${payload.placeName} and it needs a few updates before it can go live.`,
              ...(payload.reviewNotes
                ? ["", `Feedback: "${payload.reviewNotes}"`]
                : []),
              "",
              "Please make the requested changes and resubmit for review.",
            ],
        ctaText: isApproved ? "View Your Venue" : "Update Your Venue",
        ctaUrl: verifyUrl,
        footerNote: isApproved
          ? "Players can now discover and book your venue."
          : "We're looking forward to getting your venue listed!",
      },
    },
    smsText,
  };
}

export function buildClaimReviewedContent(
  payload: ClaimReviewedPayload,
  appUrl: string,
): NotificationContent {
  const ownerPlacesPath = appRoutes.organization.places.base;
  const ownerPlacesUrl = makeUrl(appUrl, ownerPlacesPath);
  const statusLabel = payload.status === "APPROVED" ? "approved" : "rejected";
  const isApproved = payload.status === "APPROVED";

  const subject = isApproved
    ? `Claim approved: ${payload.placeName} is yours`
    : `Claim update: ${payload.placeName}`;

  const approvedBody = `Great news! Your ownership claim for ${payload.placeName} has been approved. You can now manage venues, set pricing, and accept bookings.`;
  const rejectedBody = payload.reviewNotes
    ? `We were unable to approve your ownership claim for ${payload.placeName} at this time.\n\nReview notes: "${payload.reviewNotes}"\n\nIf you believe this was a mistake, please contact support for assistance.`
    : `We were unable to approve your ownership claim for ${payload.placeName} at this time. If you believe this was a mistake, please contact support for assistance.`;

  const emailText = [
    "Hi there,",
    "",
    isApproved
      ? "Your ownership claim has been approved!"
      : "Your ownership claim was not approved",
    "",
    isApproved ? approvedBody : rejectedBody,
    "",
    `Dashboard: ${ownerPlacesUrl}`,
    "",
    isApproved ? "Head to your dashboard to set up venues and pricing." : "",
  ]
    .filter(Boolean)
    .join("\n");

  const smsText = isApproved
    ? `KudosCourts: Your claim for ${payload.placeName} is approved! Start managing your venue now.`
    : `KudosCourts: Your claim for ${payload.placeName} was not approved. Log in to view the review notes.`;

  return {
    push: {
      title: `Claim ${statusLabel}`,
      body: payload.placeName,
      url: ownerPlacesPath,
      tag: `claim_request.${statusLabel}:${payload.requestId}`,
    },
    email: {
      subject,
      text: emailText,
      templateData: {
        preheader: isApproved
          ? `Your claim for ${payload.placeName} is approved! Start managing your venue.`
          : `Your claim for ${payload.placeName} was not approved.`,
        headerSubtitle: "Ownership Claim",
        title: isApproved
          ? "Your ownership claim has been approved!"
          : "Your ownership claim was not approved",
        greeting: "Hi there,",
        statusBadge: {
          label: isApproved ? "Approved" : "Not Approved",
          color: isApproved ? "success" : "warning",
        },
        bodyLines: isApproved
          ? [approvedBody]
          : [
              `We were unable to approve your ownership claim for ${payload.placeName} at this time.`,
              ...(payload.reviewNotes
                ? ["", `Review notes: "${payload.reviewNotes}"`]
                : []),
              "",
              "If you believe this was a mistake, please contact support for assistance.",
            ],
        ctaText: isApproved ? "Go to Dashboard" : "View Details",
        ctaUrl: ownerPlacesUrl,
        footerNote: isApproved
          ? "Head to your dashboard to set up venues and pricing."
          : undefined,
      },
    },
    smsText,
  };
}

export function buildReservationAwaitingPaymentContent(
  payload: ReservationAwaitingPaymentPayload,
): NotificationContent {
  const playerPath = getPlayerReservationPath({
    reservationId: payload.reservationId,
    status: "AWAITING_PAYMENT",
  });

  return {
    push: {
      title: "Payment needed",
      body: `${payload.placeName} (${payload.courtLabel})`,
      url: playerPath,
      tag: `reservation.awaiting_payment:${payload.reservationId}`,
    },
    email: null,
    smsText: null,
  };
}

export function buildReservationGroupAwaitingPaymentContent(
  payload: ReservationGroupAwaitingPaymentPayload,
): NotificationContent {
  const playerPath = getPlayerReservationPath({
    reservationId: payload.representativeReservationId,
    status: "AWAITING_PAYMENT",
  });

  return {
    push: {
      title: "Payment needed",
      body: `${payload.placeName} (${payload.itemCount} items)`,
      url: playerPath,
      tag: `reservation_group.awaiting_payment:${payload.reservationGroupId}`,
    },
    email: null,
    smsText: null,
  };
}

export function buildReservationPaymentMarkedContent(
  payload: ReservationPaymentMarkedPayload,
): NotificationContent {
  return {
    push: {
      title: "Payment marked",
      body: `${payload.playerName} marked payment for ${payload.placeName}`,
      url: appRoutes.organization.reservationDetail(payload.reservationId),
      tag: `reservation.payment_marked:${payload.reservationId}`,
    },
    email: null,
    smsText: null,
  };
}

export function buildReservationGroupPaymentMarkedContent(
  payload: ReservationGroupPaymentMarkedPayload,
): NotificationContent {
  return {
    push: {
      title: "Payment marked",
      body: `${payload.playerName} marked payment for ${payload.placeName}`,
      url: appRoutes.organization.reservationDetail(
        payload.representativeReservationId,
      ),
      tag: `reservation_group.payment_marked:${payload.reservationGroupId}`,
    },
    email: null,
    smsText: null,
  };
}

export function buildReservationConfirmedContent(
  payload: ReservationConfirmedPayload,
): NotificationContent {
  const playerPath = getPlayerReservationPath({
    reservationId: payload.reservationId,
    status: "CONFIRMED",
  });

  return {
    push: {
      title: "Reservation confirmed",
      body: `${payload.placeName} (${payload.courtLabel})`,
      url: playerPath,
      tag: `reservation.confirmed:${payload.reservationId}`,
    },
    email: null,
    smsText: null,
  };
}

export function buildReservationGroupConfirmedContent(
  payload: ReservationGroupConfirmedPayload,
): NotificationContent {
  const playerPath = getPlayerReservationPath({
    reservationId: payload.representativeReservationId,
    status: "CONFIRMED",
  });

  return {
    push: {
      title: "Reservation group confirmed",
      body: `${payload.placeName} (${payload.itemCount} items)`,
      url: playerPath,
      tag: `reservation_group.confirmed:${payload.reservationGroupId}`,
    },
    email: null,
    smsText: null,
  };
}

export function buildReservationRejectedContent(
  payload: ReservationRejectedPayload,
): NotificationContent {
  const playerPath = getPlayerReservationPath({
    reservationId: payload.reservationId,
    status: "CANCELLED",
  });

  return {
    push: {
      title: "Reservation rejected",
      body: payload.placeName,
      url: playerPath,
      tag: `reservation.rejected:${payload.reservationId}`,
    },
    email: null,
    smsText: null,
  };
}

export function buildReservationGroupRejectedContent(
  payload: ReservationGroupRejectedPayload,
): NotificationContent {
  const playerPath = getPlayerReservationPath({
    reservationId: payload.representativeReservationId,
    status: "CANCELLED",
  });

  return {
    push: {
      title: "Reservation group rejected",
      body: payload.placeName,
      url: playerPath,
      tag: `reservation_group.rejected:${payload.reservationGroupId}`,
    },
    email: null,
    smsText: null,
  };
}

export function buildReservationCancelledContent(
  payload: ReservationCancelledPayload,
): NotificationContent {
  return {
    push: {
      title: "Reservation cancelled",
      body: `${payload.playerName} cancelled ${payload.placeName}`,
      url: appRoutes.organization.reservationDetail(payload.reservationId),
      tag: `reservation.cancelled:${payload.reservationId}`,
    },
    email: null,
    smsText: null,
  };
}

export function buildReservationGroupCancelledContent(
  payload: ReservationGroupCancelledPayload,
): NotificationContent {
  return {
    push: {
      title: "Reservation group cancelled",
      body: `${payload.playerName} cancelled ${payload.placeName}`,
      url: appRoutes.organization.reservationDetail(
        payload.representativeReservationId,
      ),
      tag: `reservation_group.cancelled:${payload.reservationGroupId}`,
    },
    email: null,
    smsText: null,
  };
}

export function buildReservationCancelledByOwnerContent(
  payload: ReservationCancelledByOwnerPayload,
): NotificationContent {
  const playerPath = getPlayerReservationPath({
    reservationId: payload.reservationId,
    status: "CANCELLED",
  });

  return {
    push: {
      title: "Booking cancelled by venue",
      body: payload.placeName,
      url: playerPath,
      tag: `reservation.cancelled_by_owner:${payload.reservationId}`,
    },
    email: null,
    smsText: null,
  };
}

export function buildReservationGroupCancelledByOwnerContent(
  payload: ReservationGroupCancelledByOwnerPayload,
): NotificationContent {
  const playerPath = getPlayerReservationPath({
    reservationId: payload.representativeReservationId,
    status: "CANCELLED",
  });

  return {
    push: {
      title: "Group booking cancelled by venue",
      body: payload.placeName,
      url: playerPath,
      tag: `reservation_group.cancelled_by_owner:${payload.reservationGroupId}`,
    },
    email: null,
    smsText: null,
  };
}

export function buildReservationPingOwnerContent(
  payload: ReservationPingOwnerPayload,
): NotificationContent {
  return {
    push: {
      title: "Player needs your attention",
      body: `${payload.playerName} is trying to reach you for a reservation at ${payload.placeName} (${payload.courtLabel})`,
      url: appRoutes.organization.reservationDetail(payload.reservationId),
      tag: `reservation.ping_owner:${payload.reservationId}`,
    },
    email: null,
    smsText: null,
  };
}

export function buildCoachBookingCreatedContent(
  payload: CoachBookingCreatedPayload,
  appUrl: string,
): NotificationContent {
  const coachPath = appRoutes.coach.reservationDetail(payload.reservationId);
  const coachUrl = makeUrl(appUrl, coachPath);
  const dateFormatted = formatDateShort(payload.startTimeIso);
  const timeFormatted = formatTimeRange(
    payload.startTimeIso,
    payload.endTimeIso,
  );
  const totalFormatted = formatCurrency(
    payload.totalPriceCents,
    payload.currency,
  );

  return {
    push: {
      title: "New coach booking",
      body: `${payload.playerName} booked ${payload.coachName}`,
      url: coachPath,
      tag: `coach_booking.created:${payload.reservationId}`,
    },
    email: {
      subject: `New booking for ${payload.coachName}`,
      text: [
        "Hi Coach,",
        "",
        `${payload.playerName} booked a session with ${payload.coachName}.`,
        "",
        `Date: ${dateFormatted}`,
        `Time: ${timeFormatted}`,
        `Player: ${payload.playerName}`,
        ...(payload.playerEmail ? [`Email: ${payload.playerEmail}`] : []),
        ...(payload.playerPhone ? [`Phone: ${payload.playerPhone}`] : []),
        `Total: ${totalFormatted}`,
        "",
        `Review: ${coachUrl}`,
      ].join("\n"),
      templateData: {
        preheader: `${payload.playerName} booked ${payload.coachName} for ${dateFormatted}.`,
        headerSubtitle: "New Coach Booking",
        title: "You have a new booking request",
        greeting: "Hi Coach,",
        bodyLines: [
          `${payload.playerName} booked a session with ${payload.coachName}. Review the details and respond from your coach portal.`,
        ],
        detailRows: [
          { label: "Coach", value: payload.coachName },
          { label: "Date", value: dateFormatted },
          { label: "Time", value: timeFormatted },
          { label: "Player", value: payload.playerName },
          ...(payload.playerEmail
            ? [{ label: "Email", value: payload.playerEmail }]
            : []),
          ...(payload.playerPhone
            ? [{ label: "Phone", value: payload.playerPhone }]
            : []),
          { label: "Total", value: totalFormatted },
        ],
        ctaText: "Review Booking",
        ctaUrl: coachUrl,
      },
    },
    smsText: `KudosCourts: ${payload.playerName} booked ${payload.coachName} on ${dateFormatted}. Review: ${coachUrl}`,
  };
}

export function buildCoachBookingAwaitingPaymentContent(
  payload: CoachBookingAwaitingPaymentPayload,
): NotificationContent {
  return {
    push: {
      title: "Coach accepted your booking",
      body: `${payload.coachName} is waiting for payment`,
      url: getPlayerReservationPath({
        reservationId: payload.reservationId,
        status: "AWAITING_PAYMENT",
      }),
      tag: `coach_booking.awaiting_payment:${payload.reservationId}`,
    },
    email: null,
    smsText: null,
  };
}

export function buildCoachBookingPaymentMarkedContent(
  payload: CoachBookingPaymentMarkedPayload,
): NotificationContent {
  return {
    push: {
      title: "Coach payment marked",
      body: `${payload.playerName} marked payment for ${payload.coachName}`,
      url: appRoutes.coach.reservationDetail(payload.reservationId),
      tag: `coach_booking.payment_marked:${payload.reservationId}`,
    },
    email: null,
    smsText: null,
  };
}

export function buildCoachBookingConfirmedContent(
  payload: CoachBookingConfirmedPayload,
): NotificationContent {
  return {
    push: {
      title: "Coach session confirmed",
      body: `${payload.coachName} confirmed your booking`,
      url: getPlayerReservationPath({
        reservationId: payload.reservationId,
        status: "CONFIRMED",
      }),
      tag: `coach_booking.confirmed:${payload.reservationId}`,
    },
    email: null,
    smsText: null,
  };
}

export function buildCoachBookingRejectedContent(
  payload: CoachBookingRejectedPayload,
): NotificationContent {
  return {
    push: {
      title: "Coach booking declined",
      body: payload.reason
        ? `${payload.coachName}: ${payload.reason}`
        : `${payload.coachName} declined your booking`,
      url: appRoutes.reservations.detail(payload.reservationId),
      tag: `coach_booking.rejected:${payload.reservationId}`,
    },
    email: null,
    smsText: null,
  };
}

export function buildCoachBookingCancelledContent(
  payload: CoachBookingCancelledPayload,
): NotificationContent {
  return {
    push: {
      title: "Coach booking cancelled",
      body: payload.reason
        ? `${payload.coachName}: ${payload.reason}`
        : `${payload.coachName} cancelled the booking`,
      url: appRoutes.reservations.detail(payload.reservationId),
      tag: `coach_booking.cancelled:${payload.reservationId}`,
    },
    email: null,
    smsText: null,
  };
}

export function buildTestWebPushContent(
  payload: TestWebPushPayload,
): NotificationContent {
  return {
    push: {
      title: payload.title,
      body: payload.body ?? null,
      url: payload.url ?? null,
      tag: payload.tag ?? null,
    },
    email: null,
    smsText: null,
  };
}

type EventHandler = {
  schema: {
    safeParse: (data: unknown) => { success: boolean; data?: unknown };
  };
  build: (payload: never, appUrl: string) => NotificationContent;
};

const EVENT_HANDLERS: Record<NotificationEventType, EventHandler> = {
  "place_verification.requested": {
    schema: verificationRequestedSchema,
    build: buildVerificationRequestedContent as EventHandler["build"],
  },
  "reservation.created": {
    schema: reservationCreatedSchema,
    build: buildReservationCreatedContent as EventHandler["build"],
  },
  "reservation_group.created": {
    schema: reservationGroupCreatedSchema,
    build: buildReservationGroupCreatedContent as EventHandler["build"],
  },
  "place_verification.approved": {
    schema: verificationReviewedSchema,
    build: buildVerificationReviewedContent as EventHandler["build"],
  },
  "place_verification.rejected": {
    schema: verificationReviewedSchema,
    build: buildVerificationReviewedContent as EventHandler["build"],
  },
  "claim_request.approved": {
    schema: claimReviewedSchema,
    build: buildClaimReviewedContent as EventHandler["build"],
  },
  "claim_request.rejected": {
    schema: claimReviewedSchema,
    build: buildClaimReviewedContent as EventHandler["build"],
  },
  "reservation.awaiting_payment": {
    schema: reservationAwaitingPaymentSchema,
    build: buildReservationAwaitingPaymentContent as EventHandler["build"],
  },
  "reservation_group.awaiting_payment": {
    schema: reservationGroupAwaitingPaymentSchema,
    build: buildReservationGroupAwaitingPaymentContent as EventHandler["build"],
  },
  "reservation.payment_marked": {
    schema: reservationPaymentMarkedSchema,
    build: buildReservationPaymentMarkedContent as EventHandler["build"],
  },
  "reservation_group.payment_marked": {
    schema: reservationGroupPaymentMarkedSchema,
    build: buildReservationGroupPaymentMarkedContent as EventHandler["build"],
  },
  "reservation.confirmed": {
    schema: reservationConfirmedSchema,
    build: buildReservationConfirmedContent as EventHandler["build"],
  },
  "reservation_group.confirmed": {
    schema: reservationGroupConfirmedSchema,
    build: buildReservationGroupConfirmedContent as EventHandler["build"],
  },
  "reservation.rejected": {
    schema: reservationRejectedSchema,
    build: buildReservationRejectedContent as EventHandler["build"],
  },
  "reservation_group.rejected": {
    schema: reservationGroupRejectedSchema,
    build: buildReservationGroupRejectedContent as EventHandler["build"],
  },
  "reservation.cancelled": {
    schema: reservationCancelledSchema,
    build: buildReservationCancelledContent as EventHandler["build"],
  },
  "reservation_group.cancelled": {
    schema: reservationGroupCancelledSchema,
    build: buildReservationGroupCancelledContent as EventHandler["build"],
  },
  "reservation.cancelled_by_owner": {
    schema: reservationCancelledByOwnerSchema,
    build: buildReservationCancelledByOwnerContent as EventHandler["build"],
  },
  "reservation_group.cancelled_by_owner": {
    schema: reservationGroupCancelledByOwnerSchema,
    build:
      buildReservationGroupCancelledByOwnerContent as EventHandler["build"],
  },
  "reservation.ping_owner": {
    schema: reservationPingOwnerSchema,
    build: buildReservationPingOwnerContent as EventHandler["build"],
  },
  "coach_booking.created": {
    schema: coachBookingCreatedSchema,
    build: buildCoachBookingCreatedContent as EventHandler["build"],
  },
  "coach_booking.awaiting_payment": {
    schema: coachBookingAwaitingPaymentSchema,
    build: buildCoachBookingAwaitingPaymentContent as EventHandler["build"],
  },
  "coach_booking.payment_marked": {
    schema: coachBookingPaymentMarkedSchema,
    build: buildCoachBookingPaymentMarkedContent as EventHandler["build"],
  },
  "coach_booking.confirmed": {
    schema: coachBookingConfirmedSchema,
    build: buildCoachBookingConfirmedContent as EventHandler["build"],
  },
  "coach_booking.rejected": {
    schema: coachBookingRejectedSchema,
    build: buildCoachBookingRejectedContent as EventHandler["build"],
  },
  "coach_booking.cancelled": {
    schema: coachBookingCancelledSchema,
    build: buildCoachBookingCancelledContent as EventHandler["build"],
  },
  "test.web_push": {
    schema: testWebPushSchema,
    build: buildTestWebPushContent as EventHandler["build"],
  },
};

export function buildNotificationContent(
  eventType: string,
  payload: Record<string, unknown> | null,
  appUrl: string,
): NotificationContent | NotificationContentError {
  const handler = EVENT_HANDLERS[eventType as NotificationEventType];

  if (!handler) {
    return { error: "UNSUPPORTED_EVENT_TYPE" };
  }

  const parsed = handler.schema.safeParse(payload ?? {});
  if (!parsed.success) {
    return { error: "INVALID_PAYLOAD" };
  }

  return handler.build(parsed.data as never, appUrl);
}
