import { makeSupportClaimThreadId } from "../shared/domain";

export function makeClaimSupportChannelId(claimRequestId: string): string {
  return makeSupportClaimThreadId(claimRequestId);
}
