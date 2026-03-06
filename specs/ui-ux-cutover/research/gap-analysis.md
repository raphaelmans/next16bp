# Gap Analysis: Original Plan vs. Codebase Reality

## 1. Inaccurate File References
The plan mentions `venue-step.tsx` and `complete-step.tsx` as standalone. Reality: full wizard under `src/features/owner/components/get-started/` with 7 steps, progress bar, and 12+ overlay sheets/dialogs.

## 2. Missing Component Inventory
Beyond `button-group`, `spinner`, `field`, `empty`, there are: `page-header.tsx`, `kbd.tsx`, `item.tsx`, `input-group.tsx`, `draggable-panel.tsx` in `src/components/ui/`. Multiple `empty-state` variants scattered across features.

## 3. Chart Scope Understated
11 chart components + heatmap with hardcoded hex. Also hardcoded colors in: `navigation-progress.tsx`, `google-sign-in-button.tsx`, `contact-section.tsx`, `place-detail-mobile-sheet.tsx`, `kudoscourts-logo.tsx`, `ai-elements/connection.tsx`. 4 OpenGraph image generators.

## 4. Animation Library Not Acknowledged
Project uses `motion` v12 (Framer Motion successor). Plan only references `tailwindcss-animate`. No reconciliation strategy.

## 5. Missing Scope: Non-UI Component Directories
Plan ignores `src/components/kudos/`, `src/components/ai-elements/`, `src/components/navigation/`, `src/components/form/` (StandardForm system).

## 6. No Import Migration Strategy
Renaming/replacing components breaks imports across 90+ files. No codemod, incremental, or big-bang strategy defined.

## 7. No Mobile-First Audit
Existing mobile-specific components: `mobile-date-strip.tsx`, `mobile-day-blocks-list.tsx`, `place-detail-mobile-sheet.tsx`, `place-filters-sheet.tsx`. Plan doesn't address keep vs. merge.

## 8. Booking Studio Not Covered
10+ components with custom drag/resize/timeline UI. Most complex interactive surface in the app. Not mentioned.

## 9. Verification Strategy Invalid
`pnpm test:e2e` doesn't exist. No TypeScript compilation check mentioned. No visual regression strategy for a visual revamp.

## 10. No Design Token Source of Truth
Unclear whether `components.json`, `globals.css`, or a tokens file is authoritative. shadcn CLI overwrites CSS variables on install.
