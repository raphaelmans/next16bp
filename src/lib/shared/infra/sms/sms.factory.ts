import { SemaphoreSmsService } from "./semaphore-sms.service";
import type { SmsServiceStrategy } from "./sms-service";

let smsService: SmsServiceStrategy | null = null;

export function makeSmsService(): SmsServiceStrategy {
  if (!smsService) {
    smsService = new SemaphoreSmsService();
  }
  return smsService;
}
