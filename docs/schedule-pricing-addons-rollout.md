# Schedule Pricing Addons v2 Rollout

## Deployment sequence

1. Apply additive migration:
   - `drizzle/0029_schedule_pricing_addons.sql`
2. Backfill pricing type for legacy/null add-ons:
   - `pnpm db:backfill:court-addon-pricing-type`
3. Deploy application code with v2 addon pricing support.
4. Run migration validation:
   - `pnpm script:validate-addon-pricing-migration`
5. Run addon pricing contract checks:
   - `pnpm script:contract-test-schedule-pricing-addons`

## Rollback guardrail

- Use `ENABLE_ADDON_PRICING_V2=false` to disable addon contribution in pricing logic while keeping base pricing intact.
- This allows emergency rollback of addon evaluation without reverting schema changes.

## Post-deploy checks

1. Confirm no data-shape violations:
   - missing FLAT fee fields
   - HOURLY rules missing hourly fields
   - overlapping add-on rule windows
   - addon/base currency mismatches
2. Watch structured logs for:
   - `reservation.pricing_addon_warnings`
   - `reservation.pricing_addon_currency_mismatch`
   - `availability.pricing_addon_warnings`
   - `availability.pricing_addon_currency_mismatch`
3. Verify parity against docs:
   - `docs/schedule-pricing-addons-state-machine.md`
   - `docs/schedule-pricing-addons-erd.md`

## Notes

- `AUTO_STRICT` remains deferred and intentionally disabled in runtime behavior.
- `AUTO` uncovered segments contribute `+0` and emit warning telemetry.
