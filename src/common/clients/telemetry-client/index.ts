"use client";

import ky from "ky";

const telemetryKy = ky.create({
  throwHttpErrors: false,
  timeout: 10_000,
});

export type TelemetryEventName =
  | "funnel.landing_search_submitted"
  | "funnel.discovery_place_clicked"
  | "funnel.schedule_slot_selected"
  | "funnel.reserve_clicked"
  | "funnel.login_started"
  | "funnel.owner_list_your_venue_viewed"
  | "funnel.owner_list_your_venue_cta_clicked"
  | "funnel.owner_list_your_venue_signin_clicked"
  | "funnel.owner_list_your_venue_nav_clicked"
  | "funnel.owner_get_started_viewed"
  | "funnel.owner_get_started_cta_clicked"
  | "funnel.owner_get_started_signin_clicked"
  | "funnel.owner_setup_hub_viewed"
  | "funnel.owner_org_created"
  | "funnel.owner_add_venue_clicked"
  | "funnel.owner_claim_submitted"
  | "funnel.owner_import_started"
  | "funnel.owner_wizard_step_viewed";

export type TelemetryPayload = {
  event: TelemetryEventName;
  properties?: Record<string, unknown>;
};

export async function trackEvent(payload: TelemetryPayload) {
  try {
    await telemetryKy.post("/api/public/track", {
      json: payload,
    });
  } catch {
    // Best-effort telemetry; ignore failures.
  }
}
