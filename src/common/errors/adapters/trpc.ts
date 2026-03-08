import { isRecord } from "@/common/type-guards";

const toRecordOrEmpty = (value: unknown): Record<string, unknown> =>
  isRecord(value) ? value : {};

const getErrorData = (
  errRecord: Record<string, unknown>,
): Record<string, unknown> => {
  const directData = toRecordOrEmpty(errRecord.data);
  if (Object.keys(directData).length > 0) {
    return directData;
  }

  const shape = toRecordOrEmpty(errRecord.shape);
  return toRecordOrEmpty(shape.data);
};

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

  const errRecord = toRecordOrEmpty(err);
  const data = getErrorData(errRecord);
  const zodError = toRecordOrEmpty(data.zodError);
  const fieldErrors = toRecordOrEmpty(zodError.fieldErrors);

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
