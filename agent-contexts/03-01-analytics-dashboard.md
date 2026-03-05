---
tags:
  - agent-context
  - frontend/owner
  - backend/analytics
date: 2026-03-05
previous: 03-00-availability-perf-optimization.md
related_contexts:
  - 03-00-availability-perf-optimization.md
  - 02-10-interactive-map-picker.md
---

# Analytics Dashboard — Integrated into Owner Dashboard

## Summary

Implemented a full analytics dashboard as a tabbed section on the existing owner dashboard (`/organization`). Three tabs — Revenue, Utilization, Operations — each with KPI cards and multiple Recharts charts using shadcn's `ChartContainer`. Backend uses raw SQL via Drizzle's `sql` template tag for complex aggregation queries.

## Changes Made

### Backend — New Module `src/lib/modules/analytics/`

- `dtos/analytics.dto.ts` — Zod schemas for shared input (`AnalyticsInputSchema`) and three output types (Revenue, Utilization, Operations)
- `repositories/analytics.repository.ts` — 15+ SQL query methods (revenue by day/court/dow/hour, utilization heatmap, response times, cancellation breakdown, lead times, bookings by hour created)
- `services/analytics.service.ts` — Aggregation logic with previous-period comparison, bucketing for response times and lead times, utilization calculation from court hours windows
- `factories/analytics.factory.ts` — Singleton DI factory
- `analytics.router.ts` — 3 tRPC `protectedProcedure` query endpoints

### Frontend — Analytics Components

- `src/features/owner/components/analytics/analytics-section.tsx` — Tab wrapper with nuqs URL state
- `src/features/owner/components/analytics/analytics-date-range-selector.tsx` — 7d/30d/90d period picker
- `src/features/owner/components/analytics/analytics-kpi-card.tsx` — Reusable KPI card with trend arrows
- `src/features/owner/components/analytics/revenue-tab.tsx` — Revenue tab (3 KPIs + 4 charts)
- `src/features/owner/components/analytics/utilization-tab.tsx` — Utilization tab (3 KPIs + 3 charts)
- `src/features/owner/components/analytics/operations-tab.tsx` — Operations tab (3 KPIs + 4 charts)
- 11 chart components in `src/features/owner/components/analytics/charts/`

### Frontend — Hooks & API

- `src/features/owner/hooks/analytics.ts` — 3 query hooks with lazy tab loading (`enabled` flag)
- `src/features/owner/api.ts` — Added 3 query methods to `OwnerApi` class

### Modified Files

- `src/lib/shared/infra/trpc/root.ts` — Registered `analytics` router
- `src/features/owner/hooks/index.ts` — Re-exported analytics hooks
- `src/features/owner/pages/owner-dashboard-page.tsx` — Removed `ComingSoonCard`, changed stats grid to 3-col, added compact analytics CTA button and `<AnalyticsSection>` at bottom

## Key Decisions

- **ISO strings over Date objects** — postgres.js driver can't serialize `Date` objects in Drizzle raw `sql` template literals. All date params are ISO strings with `::timestamptz` casts in SQL.
- **Postgres array params** — Drizzle interpolates JS arrays as individual params, not Postgres arrays. Used `pgArray()` helper: `sql\`ARRAY[${sql.join(...)}]::uuid[]\`` for `ANY()` clauses.
- **Default period 7d** — User requested 7-day default instead of 30d.
- **Lazy tab loading** — Only the active tab's query fires (`enabled: activeTab === "revenue"` etc.) with `staleTime: 5 * 60 * 1000`.
- **Compact CTA** — Small button bar with BarChart3 icon between stats cards and activity grid, smooth-scrolls to analytics section.

## Next Steps

- End-to-end verification with live data
- Consider adding custom date range picker (currently only preset periods)
- Mobile responsive testing for chart components
