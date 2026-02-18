const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

export type TrpcErrorMeta = {
  code?: string;
  status?: number;
  requestId?: string;
  zodFieldErrors?: Record<string, string>;
};

export const toTrpcErrorMeta = (err: unknown): TrpcErrorMeta => {
  if (!(err instanceof Error)) {
    return {};
  }

  const errRecord = asRecord(err);
  const data = asRecord(errRecord.data);
  const zodError = asRecord(data.zodError);
  const fieldErrors = asRecord(zodError.fieldErrors);

  const normalizedFieldErrors: Record<string, string> = {};
  for (const [key, value] of Object.entries(fieldErrors)) {
    if (Array.isArray(value) && typeof value[0] === "string") {
      normalizedFieldErrors[key] = value[0];
    }
  }

  const code =
    typeof data.code === "string"
      ? data.code
      : typeof errRecord.code === "string"
        ? errRecord.code
        : undefined;

  const status =
    typeof data.httpStatus === "number"
      ? data.httpStatus
      : typeof errRecord.status === "number"
        ? errRecord.status
        : undefined;

  const requestId =
    typeof data.requestId === "string" ? data.requestId : undefined;

  return {
    code,
    status,
    requestId,
    zodFieldErrors:
      Object.keys(normalizedFieldErrors).length > 0
        ? normalizedFieldErrors
        : undefined,
  };
};
