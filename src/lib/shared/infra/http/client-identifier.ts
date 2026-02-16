const FORWARDED_HEADERS = [
  "cf-connecting-ip",
  "x-real-ip",
  "x-forwarded-for",
] as const;

function normalizeIp(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const first = value.split(",")[0]?.trim();
  if (!first) {
    return null;
  }

  return first.toLowerCase();
}

export type ClientIdentifier = {
  value: string;
  source: "ip" | "fallback";
};

export function getClientIdentifier(req: Request): ClientIdentifier {
  for (const header of FORWARDED_HEADERS) {
    const ip = normalizeIp(req.headers.get(header));
    if (ip) {
      return {
        value: `ip:${ip}`,
        source: "ip",
      };
    }
  }

  return {
    value: "anon:fallback",
    source: "fallback",
  };
}
