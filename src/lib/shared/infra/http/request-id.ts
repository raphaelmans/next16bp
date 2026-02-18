export function getRequestId(req: Request): string {
  return req.headers.get("x-request-id") ?? globalThis.crypto.randomUUID();
}
