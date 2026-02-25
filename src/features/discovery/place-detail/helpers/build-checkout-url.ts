import { appRoutes } from "@/common/app-routes";
import { getZonedDayKey } from "@/common/time-zone";
import type { SelectedAddon } from "@/features/court-addons/schemas";
import type { BookingCartItem } from "../stores/booking-cart-store";

type BuildCartCheckoutUrlInput = {
  placeSlugOrId: string;
  sportId?: string;
  cartItems: BookingCartItem[];
};

export function buildCartCheckoutUrl({
  placeSlugOrId,
  sportId,
  cartItems,
}: BuildCartCheckoutUrlInput): string {
  const params = new URLSearchParams();
  if (sportId) {
    params.set("sportId", sportId);
  }
  const itemsEncoded = cartItems
    .map((item) => `${item.courtId}|${item.startTime}|${item.durationMinutes}`)
    .join(",");
  params.set("items", itemsEncoded);
  return `${appRoutes.places.book(placeSlugOrId)}?${params.toString()}`;
}

type BuildSingleCheckoutUrlInput = {
  placeSlugOrId: string;
  startTime: string;
  durationMinutes: number;
  selectionMode: "any" | "court";
  sportId?: string;
  selectedDate?: Date;
  placeTimeZone: string;
  courtId?: string;
  selectedAddons: SelectedAddon[];
};

export function buildSingleCheckoutUrl({
  placeSlugOrId,
  startTime,
  durationMinutes,
  selectionMode,
  sportId,
  selectedDate,
  placeTimeZone,
  courtId,
  selectedAddons,
}: BuildSingleCheckoutUrlInput): string {
  const params = new URLSearchParams();
  params.set("duration", String(durationMinutes));
  params.set("mode", selectionMode);
  if (sportId) {
    params.set("sportId", sportId);
  }
  if (selectedDate) {
    params.set("date", getZonedDayKey(selectedDate, placeTimeZone));
  }
  if (selectionMode === "court" && courtId) {
    params.set("courtId", courtId);
  }
  if (selectedAddons.length > 0) {
    const encoded = selectedAddons
      .map((a) => (a.quantity === 1 ? a.addonId : `${a.addonId}:${a.quantity}`))
      .join(",");
    params.set("addonIds", encoded);
  }
  params.set("startTime", startTime);
  return `${appRoutes.places.book(placeSlugOrId)}?${params.toString()}`;
}
