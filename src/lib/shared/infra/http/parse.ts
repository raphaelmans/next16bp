export async function parseJson(req: Request): Promise<unknown> {
  return req.json();
}

export async function parseFormData(req: Request): Promise<FormData> {
  return req.formData();
}

export function parseUrl(req: Request): URL {
  return new URL(req.url);
}

export function parseSearchParams(req: Request): URLSearchParams {
  return parseUrl(req).searchParams;
}

export function getStringParam(
  params: URLSearchParams,
  key: string,
): string | undefined {
  return params.get(key) ?? undefined;
}

export function getNumberParam(
  params: URLSearchParams,
  key: string,
): number | string | undefined {
  const value = params.get(key);
  if (value === null) return undefined;

  const parsed = Number(value);
  return Number.isNaN(parsed) ? value : parsed;
}

export function getBooleanParam(
  params: URLSearchParams,
  key: string,
): boolean | string | undefined {
  const value = params.get(key);
  if (value === null) return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}

export function getCsvParam(
  params: URLSearchParams,
  key: string,
): string[] | undefined {
  const value = params.get(key);
  if (!value) return undefined;

  const list = value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  return list.length > 0 ? list : undefined;
}
