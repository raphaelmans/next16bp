import { createHash, createHmac, timingSafeEqual } from "node:crypto";

type QstashJwtHeader = {
  alg?: string;
  typ?: string;
};

type QstashJwtPayload = {
  iss?: string;
  sub?: string;
  exp?: number;
  nbf?: number;
  iat?: number;
  body?: string;
};

type VerifyQstashSignatureInput = {
  body: string;
  currentSigningKey?: string;
  nextSigningKey?: string;
  signature: string | null;
  url: string;
};

type VerifyQstashSignatureResult =
  | {
      ok: true;
      payload: QstashJwtPayload;
    }
  | {
      ok: false;
      reason: string;
    };

function decodeBase64Url(segment: string): Buffer {
  const normalized = segment.replace(/-/g, "+").replace(/_/g, "/");
  const paddingLength = (4 - (normalized.length % 4)) % 4;
  const padded = `${normalized}${"=".repeat(paddingLength)}`;
  return Buffer.from(padded, "base64");
}

function parseJwt(token: string): {
  header: QstashJwtHeader;
  payload: QstashJwtPayload;
  signature: Buffer;
  signingInput: string;
} | null {
  const segments = token.split(".");
  if (segments.length !== 3) return null;

  const [headerSegment, payloadSegment, signatureSegment] = segments;
  if (!headerSegment || !payloadSegment || !signatureSegment) return null;

  try {
    const header = JSON.parse(
      decodeBase64Url(headerSegment).toString("utf8"),
    ) as QstashJwtHeader;
    const payload = JSON.parse(
      decodeBase64Url(payloadSegment).toString("utf8"),
    ) as QstashJwtPayload;

    return {
      header,
      payload,
      signature: decodeBase64Url(signatureSegment),
      signingInput: `${headerSegment}.${payloadSegment}`,
    };
  } catch {
    return null;
  }
}

function verifyJwtSignature(
  signingInput: string,
  signature: Buffer,
  signingKey: string,
) {
  const expected = createHmac("sha256", signingKey)
    .update(signingInput)
    .digest();
  if (expected.length !== signature.length) return false;
  return timingSafeEqual(expected, signature);
}

function verifyJwtClaims(payload: QstashJwtPayload, body: string, url: string) {
  const nowInSeconds = Math.floor(Date.now() / 1000);

  if (payload.iss !== "Upstash") {
    return { ok: false as const, reason: "INVALID_ISSUER" };
  }

  if (payload.sub !== url) {
    return { ok: false as const, reason: "INVALID_SUBJECT" };
  }

  if (typeof payload.nbf === "number" && payload.nbf > nowInSeconds) {
    return { ok: false as const, reason: "TOKEN_NOT_ACTIVE" };
  }

  if (typeof payload.exp !== "number" || payload.exp <= nowInSeconds) {
    return { ok: false as const, reason: "TOKEN_EXPIRED" };
  }

  const expectedBodyHash = createHash("sha256")
    .update(body)
    .digest("base64url");
  if (payload.body !== expectedBodyHash) {
    return { ok: false as const, reason: "INVALID_BODY_HASH" };
  }

  return { ok: true as const };
}

export function verifyQstashSignature(
  input: VerifyQstashSignatureInput,
): VerifyQstashSignatureResult {
  if (!input.signature) {
    return { ok: false, reason: "MISSING_SIGNATURE_HEADER" };
  }

  const parsed = parseJwt(input.signature);
  if (!parsed) {
    return { ok: false, reason: "INVALID_SIGNATURE_FORMAT" };
  }

  if (parsed.header.alg !== "HS256") {
    return { ok: false, reason: "INVALID_ALGORITHM" };
  }

  const signingKeys = [input.currentSigningKey, input.nextSigningKey].filter(
    (key): key is string => Boolean(key),
  );

  if (!signingKeys.length) {
    return { ok: false, reason: "MISSING_SIGNING_KEYS" };
  }

  for (const signingKey of signingKeys) {
    const validSignature = verifyJwtSignature(
      parsed.signingInput,
      parsed.signature,
      signingKey,
    );

    if (!validSignature) {
      continue;
    }

    const claimsCheck = verifyJwtClaims(parsed.payload, input.body, input.url);
    if (!claimsCheck.ok) {
      return { ok: false, reason: claimsCheck.reason };
    }

    return { ok: true, payload: parsed.payload };
  }

  return { ok: false, reason: "SIGNATURE_VERIFICATION_FAILED" };
}
