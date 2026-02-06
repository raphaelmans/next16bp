export function makeClaimSupportChannelId(claimRequestId: string): string {
  return `cr-${claimRequestId}`;
}
