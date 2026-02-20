export type ExpoPushPayload = {
  to: string;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
  sound?: "default";
};

export class ExpoPushError extends Error {
  statusCode?: number;
  code?: string;
  details?: Record<string, unknown>;

  constructor(
    message: string,
    options?: {
      statusCode?: number;
      code?: string;
      details?: Record<string, unknown>;
    },
  ) {
    super(message);
    this.name = "ExpoPushError";
    this.statusCode = options?.statusCode;
    this.code = options?.code;
    this.details = options?.details;
  }
}

export interface ExpoPushServiceStrategy {
  sendPush(payload: ExpoPushPayload): Promise<{ ticketId?: string }>;
}
