import { createHash, createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyQstashSignature } from "@/lib/shared/infra/qstash/qstash-signature";

const CURRENT_KEY = "current-signing-key";
const NEXT_KEY = "next-signing-key";
const URL =
  "https://example.com/api/internal/queue/dispatch-notification-delivery";

function sign(payload: Record<string, unknown>, signingKey: string) {
  const headerSegment = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" }),
  ).toString("base64url");
  const payloadSegment = Buffer.from(JSON.stringify(payload)).toString(
    "base64url",
  );
  const signingInput = `${headerSegment}.${payloadSegment}`;
  const signature = createHmac("sha256", signingKey)
    .update(signingInput)
    .digest("base64url");

  return `${signingInput}.${signature}`;
}

describe("verifyQstashSignature", () => {
  it("accepts a valid signature and claims", () => {
    const body = JSON.stringify({ reason: "jobs_enqueued" });
    const bodyHash = createHash("sha256").update(body).digest("base64url");
    const now = Math.floor(Date.now() / 1000);

    const token = sign(
      {
        iss: "Upstash",
        sub: URL,
        exp: now + 300,
        nbf: now - 10,
        body: bodyHash,
      },
      CURRENT_KEY,
    );

    const result = verifyQstashSignature({
      body,
      signature: token,
      url: URL,
      currentSigningKey: CURRENT_KEY,
      nextSigningKey: NEXT_KEY,
    });

    expect(result.ok).toBe(true);
  });

  it("rejects token with invalid body hash", () => {
    const body = JSON.stringify({ reason: "jobs_enqueued" });
    const now = Math.floor(Date.now() / 1000);

    const token = sign(
      {
        iss: "Upstash",
        sub: URL,
        exp: now + 300,
        nbf: now - 10,
        body: "invalid",
      },
      CURRENT_KEY,
    );

    const result = verifyQstashSignature({
      body,
      signature: token,
      url: URL,
      currentSigningKey: CURRENT_KEY,
      nextSigningKey: NEXT_KEY,
    });

    expect(result).toEqual({
      ok: false,
      reason: "INVALID_BODY_HASH",
    });
  });
});
