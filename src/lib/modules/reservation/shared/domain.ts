export type ReservationLifecycleStatus =
  | "CREATED"
  | "AWAITING_PAYMENT"
  | "PAYMENT_MARKED_BY_USER"
  | "CONFIRMED"
  | "EXPIRED"
  | "CANCELLED";

export type BlockingReservationOverlapRecord = {
  status: ReservationLifecycleStatus;
  expiresAt: Date | string | null;
};

export type ReservationGroupRequestedItem = {
  courtId: string;
  startTime: string;
  durationMinutes: number;
};

export type ReservationGroupPricingItem = {
  totalPriceCents: number;
  currency: string;
};

export function toReservationGroupItemKey(
  item: ReservationGroupRequestedItem,
): string {
  return `${item.courtId}|${item.startTime}|${item.durationMinutes}`;
}

export function findReservationGroupDuplicateItemKeys(
  items: ReservationGroupRequestedItem[],
): string[] {
  const keyCounts = new Map<string, number>();
  for (const item of items) {
    const key = toReservationGroupItemKey(item);
    keyCounts.set(key, (keyCounts.get(key) ?? 0) + 1);
  }
  return Array.from(keyCounts.entries())
    .filter(([, count]) => count > 1)
    .map(([key]) => key);
}

export function computeReservationGroupTotals(
  items: ReservationGroupPricingItem[],
): {
  totalPriceCents: number;
  currency: string | null;
  hasMixedCurrencies: boolean;
} {
  if (items.length === 0) {
    return {
      totalPriceCents: 0,
      currency: null,
      hasMixedCurrencies: false,
    };
  }

  const firstCurrency = items[0]?.currency ?? null;
  let totalPriceCents = 0;

  for (const item of items) {
    totalPriceCents += item.totalPriceCents;
  }

  return {
    totalPriceCents,
    currency: firstCurrency,
    hasMixedCurrencies: items.some((item) => item.currency !== firstCurrency),
  };
}

const STATUS_PRIORITY: Record<ReservationLifecycleStatus, number> = {
  PAYMENT_MARKED_BY_USER: 0,
  AWAITING_PAYMENT: 1,
  CREATED: 2,
  CONFIRMED: 3,
  EXPIRED: 4,
  CANCELLED: 5,
};

export function deriveReservationGroupStatus(
  statuses: ReservationLifecycleStatus[],
): ReservationLifecycleStatus {
  if (statuses.length === 0) {
    return "CREATED";
  }

  return statuses.reduce((selected, current) =>
    STATUS_PRIORITY[current] < STATUS_PRIORITY[selected] ? current : selected,
  );
}

export function filterBlockingReservationOverlaps<
  T extends BlockingReservationOverlapRecord,
>(records: T[], now: Date = new Date()): T[] {
  return records.filter((record) => {
    if (record.status === "CONFIRMED") return true;
    if (!record.expiresAt) return true;
    return new Date(record.expiresAt) > now;
  });
}
