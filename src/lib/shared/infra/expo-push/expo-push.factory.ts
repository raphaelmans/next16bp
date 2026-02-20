import { ExpoPushService } from "./expo-push.provider";
import type { ExpoPushServiceStrategy } from "./expo-push-service";

let expoPushService: ExpoPushServiceStrategy | null = null;

export function makeExpoPushService(): ExpoPushServiceStrategy {
  if (!expoPushService) {
    expoPushService = new ExpoPushService();
  }
  return expoPushService;
}
