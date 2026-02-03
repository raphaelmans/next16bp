import { createHash } from "node:crypto";

export function makeDmChannelId(userId: string, otherUserId: string): string {
  const [first, second] = [userId, otherUserId].sort((a, b) =>
    a.localeCompare(b),
  );
  const hash = createHash("sha256")
    .update(`${first}:${second}`)
    .digest("hex")
    .slice(0, 32);
  return `dm-${hash}`;
}
