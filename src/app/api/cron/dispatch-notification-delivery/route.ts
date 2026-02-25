import type { NextRequest } from "next/server";
import { dispatchNotificationDelivery } from "@/lib/modules/notification-delivery/http/dispatch-notification-delivery.handler";

export async function GET(request: NextRequest) {
  return dispatchNotificationDelivery(request);
}

export const dynamic = "force-dynamic";
