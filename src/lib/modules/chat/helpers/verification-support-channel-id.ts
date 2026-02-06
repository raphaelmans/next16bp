export function makeVerificationSupportChannelId(
  placeVerificationRequestId: string,
): string {
  return `vr-${placeVerificationRequestId}`;
}
