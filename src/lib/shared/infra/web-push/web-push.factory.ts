import { WebPushService } from "./web-push.provider";
import type { WebPushServiceStrategy } from "./web-push-service";

let webPushService: WebPushServiceStrategy | null = null;

export function makeWebPushService(): WebPushServiceStrategy {
  if (!webPushService) {
    webPushService = new WebPushService();
  }
  return webPushService;
}
