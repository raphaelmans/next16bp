export type SmsPayload = {
  to: string;
  message: string;
  senderName?: string;
  priority?: boolean;
};

/**
 * Strategy interface for SMS delivery providers.
 */
export interface SmsServiceStrategy {
  sendSms(payload: SmsPayload): Promise<{ id?: string }>;
}
