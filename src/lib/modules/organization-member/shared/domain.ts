export function deriveEnabledReservationNotificationUserIds(input: {
  eligibleUserIds: string[];
  optedInUserIds: string[];
}): string[] {
  if (input.eligibleUserIds.length === 0 || input.optedInUserIds.length === 0) {
    return [];
  }

  const optedInSet = new Set(input.optedInUserIds);
  const seen = new Set<string>();
  const enabledUserIds: string[] = [];

  for (const userId of input.eligibleUserIds) {
    if (!optedInSet.has(userId) || seen.has(userId)) {
      continue;
    }
    seen.add(userId);
    enabledUserIds.push(userId);
  }

  return enabledUserIds;
}

export function deriveReservationNotificationRoutingStatus(
  organizationId: string,
  enabledUserIds: string[],
): {
  organizationId: string;
  enabledRecipientCount: number;
  hasEnabledRecipients: boolean;
} {
  const enabledRecipientCount = enabledUserIds.length;
  return {
    organizationId,
    enabledRecipientCount,
    hasEnabledRecipients: enabledRecipientCount > 0,
  };
}
