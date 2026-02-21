import { makeSupportVerificationThreadId } from "../shared/domain";

export function makeVerificationSupportChannelId(
  placeVerificationRequestId: string,
): string {
  return makeSupportVerificationThreadId(placeVerificationRequestId);
}
