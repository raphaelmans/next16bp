# UI/UX Cutover Scratchpad

## Iteration 1 — Study & Plan

### Understanding
Big-bang UI cutover: ~280 files, 14 steps. Mobile-first PWA, light-only, shadcn-ui only. On main branch currently, need to create cutover branch.

### Plan
Follow the 14-step plan from `specs/ui-ux-cutover/plan.md`. Each step becomes a task. Start with Step 1 (Foundation) which is the base for everything else.

### Step 1 Analysis
- Remove `.dark` block from globals.css (lines 121-173)
- Remove `@custom-variant dark` line (line 21)
- Reset 47 shadcn components via CLI with --overwrite
- Remove `motion` from package.json
- Run pnpm install
- Verify globals.css tokens weren't overwritten by shadcn CLI
- Run pnpm lint

### Decision
Starting with Step 1: Foundation. This is the clean baseline everything builds on.
Confidence: 95 — clear starting point per plan.

## Iteration 1 — Step 1 DONE

### Completed
- Created `ui-ux-cutover` branch from main
- Removed `.dark` block (lines 121-173) and `@custom-variant dark` from globals.css
- Reset all 47 shadcn components via `npx shadcn@latest add --overwrite`
- Had to re-remove a `.dark` sidebar block the shadcn CLI re-injected
- Removed `motion` from package.json, ran pnpm install
- Auto-fixed 83 lint import type issues from shadcn reset
- Committed: df2eac4

### Observations
- shadcn CLI preserves :root tokens but injects its own .dark block — need to re-clean after reset
- Pre-existing lint errors (24 errors, 39 warnings) are NOT from our changes — they existed before
- Some non-UI files got lint auto-formatted (analytics, routers) — left those unstaged for now
- Steps 2-14 are now unblocked since Step 1 is done

## Iteration 2 — Step 3 DONE

### Completed
- Replaced all 45+ loading text instances across 36 files with Spinner icons
- Three patterns addressed:
  1. Button ternaries (`isPending ? "Saving..." : "Label"` → `{isPending && <Spinner />} Label`)
  2. CommandEmpty placeholders (loading text → centered Spinner)
  3. Organization name fallbacks (`"Loading..."` → `""`)
- Refactored `getBlockCtaLabel` to remove `isSubmitting` param — callers now handle spinner
- Replaced Loader2 imports with Spinner component where applicable
- Updated test expectations for `getBlockCtaLabel`
- Also caught and fixed: "Resolving…", "Signing Out..." variants
- Committed: c90e350

### Observations
- Pre-existing lint errors unchanged (47 errors, 39 warnings) — none from our changes
- Pre-existing TS errors for `"warning"` / `"success"` badge variants and `motion/react` imports exist but are outside this task scope
- Grep for loading text patterns returns zero matches — acceptance criteria met

## Iteration 3 — Step 4 DONE

### Completed
- Migrated all 9 files from `motion/react` to CSS animations (tailwindcss-animate)
- Migration patterns used:
  1. **Shimmer** → pure CSS `@keyframes shimmer` animation with `--shimmer-duration` CSS var
  2. **Peek bars** (2 files) → `animate-in slide-in-from-bottom duration-200`
  3. **Summary bars** (week-grid, time-range-picker) → `animate-in fade-in duration-150`
  4. **Accent bars & dots** (grid cells, slot rows) → `animate-in fade-in/zoom-in-50 duration-150`
  5. **Content switching** (court-detail, 2 coordinators) → `animate-in fade-in duration-200` (no exit animations needed)
- Also caught and fixed: "Removing..." loading text in mobile-manage-block-peek-bar (missed by Step 3)
- Added `@keyframes shimmer` to globals.css
- Zero `from "motion"` imports remain in src/
- Zero `"motion"` references in package.json
- Lint: 57 errors / 39 warnings (all pre-existing, none from our changes)

### Observations
- `tailwindcss-animate` classes (`animate-in`, `slide-in-from-bottom`, `fade-in`, `zoom-in-50`) are already available via shadcn reset
- Exit animations (AnimatePresence exit) are dropped — CSS doesn't support exit animations natively without JS. The enter animations provide sufficient UX polish.
- The `useReducedMotion` hook was removed from all files — CSS animations respect `prefers-reduced-motion` via the `@media` query already baked into tailwindcss-animate

## Iteration 4 — Step 5 DONE

### Completed
- Replaced hardcoded hex/rgba in 7 non-chart, non-OG files with CSS variable tokens
- Patterns used:
  1. **Brand shadows** (primary-tinted): `color-mix(in oklch, var(--color-primary) N%, transparent)`
  2. **Neutral shadows** (black): `oklch(0 0 0 / alpha)`
  3. **White overlays**: `oklch(1 0 0 / alpha)`
  4. **Tailwind classes**: `text-success`, `bg-card`, `from-primary/90 to-primary`, etc.
  5. **SVG fills**: `var(--color-background)`
- Files fixed: connection.tsx, navigation-progress.tsx, place-detail-mobile-sheet.tsx, place-detail-skeleton.tsx, home-page-client.tsx, home-search-form.tsx, reservation-payment-page.tsx
- Committed: 545f033

### Documented Exceptions (kept as-is)
- `kudoscourts-logo.tsx`: SVG brand hex required
- `google-sign-in-button.tsx`: Google brand colors (also has "Redirecting..." loading text — Step 3 miss)
- `venue-qr-code-dialog.tsx`: QR code must be B/W
- `contact-section.tsx`: Social media brand colors (Facebook, Instagram, Viber)
- `shimmer.tsx`: `#0000` transparent shorthand in CSS gradient

### Remaining for Other Steps
- 11 chart files → Step 11
- 5 OG image files → Step 12
- Lint: 57 errors / 39 warnings (all pre-existing)

## Iteration 5 — Step 2 DONE

### Completed
- Added safe area insets to 4 fixed-position elements that lacked them:
  1. **discovery navbar** (`discovery/components/navbar.tsx`): `top-4` → `top-[max(1rem,env(safe-area-inset-top))]` for iOS notch
  2. **place-detail-mobile-sheet**: added `pb-[max(0px,env(safe-area-inset-bottom))]` to fixed bottom sheet
  3. **place-detail-skeleton**: added `pb-[max(1.25rem,env(safe-area-inset-bottom))]` to fixed bottom skeleton
  4. **court-detail-client**: added `pb-[max(1rem,env(safe-area-inset-bottom))]` to mobile sticky CTA
- Fixed 3 remaining loading text misses from Step 3:
  1. `admin-claims-page.tsx`: "Refreshing" → static "Refresh" (spinner already on icon)
  2. `admin-verification-page.tsx`: same pattern
  3. `google-sign-in-button.tsx`: "Redirecting..." → keep label, swap icon to Spinner
- Removed unused `Loader2` import from `place-detail-mobile-sheet.tsx`, replaced with Spinner
- Layout shell files (dashboard-bottom-tabs, dashboard-layout, dashboard-shell, etc.) already fully token-based
- Lint: 57-58 errors / 39 warnings (all pre-existing, count varies between runs)

### Observations
- 12 files already had safe-area treatment before this step (bottom tabs, peek bars, chat widgets, etc.)
- The layout components were already well-structured with token classes from previous work
- 36 files still have `dark:` classes — mostly shadcn UI components (harmless since .dark class removed) and some feature files (will be cleaned in Steps 7-9)
- health-check.tsx has hardcoded colors (yellow-100, red-100, green-100) — dev-only component, documented exception
