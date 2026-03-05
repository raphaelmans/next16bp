# UI/UX Cutover — Implementation Plan

## Checklist

- [ ] Step 1: Foundation — Token System & shadcn Reset
- [ ] Step 2: Layout Shell — Navigation & Safe Zones
- [ ] Step 3: Loading States — Kill All Loading Text
- [ ] Step 4: Motion Removal — Migrate to CSS Animations
- [ ] Step 5: Color Token Migration — Hardcoded Colors
- [ ] Step 6: Empty States — Standardize on shadcn Empty
- [ ] Step 7: Auth & Onboarding — Re-skin + Copywriting
- [ ] Step 8: Player Flows — Discovery, Booking, Reservations
- [ ] Step 9: Owner Flows — Dashboard, Courts, Settings
- [ ] Step 10: Booking Studio — Full Redesign
- [ ] Step 11: Analytics Charts — Token-based Theming
- [ ] Step 12: Marketing Pages & OG Images
- [ ] Step 13: Polish Pass — Normalize, Clarify, Harden
- [ ] Step 14: Validation & Verification

---

## Step 1: Foundation — Token System & shadcn Reset

**Objective:** Establish the clean design system baseline that all subsequent steps build on.

**Implementation guidance:**
1. Create cutover branch from main
2. Remove `.dark` block from `globals.css` (lines 121-173)
3. Remove `@custom-variant dark` line
4. Audit `:root` tokens — keep primary teal, accent orange, extended tokens (success, warning, destructive-light)
5. Reset all 47 shadcn components via CLI:
   ```bash
   npx shadcn@latest add --overwrite accordion alert alert-dialog aspect-ratio avatar badge breadcrumb button button-group calendar card carousel chart checkbox collapsible command context-menu dialog drawer dropdown-menu empty field form hover-card input input-group input-otp item kbd label menubar navigation-menu pagination popover progress radio-group resizable scroll-area select separator sheet sidebar skeleton slider sonner spinner switch table tabs textarea toggle toggle-group tooltip
   ```
6. Verify `globals.css` tokens were not overwritten by shadcn CLI — restore if needed
7. Remove `motion` from `package.json` dependencies
8. Run `pnpm install` to update lockfile
9. Run `pnpm lint` — fix any immediate breakage from component API changes

**Test requirements:**
- `pnpm lint` passes
- `grep -r "\.dark" src/app/globals.css` returns zero matches
- `grep -r '"motion"' package.json` returns zero matches

**Integration notes:**
- This step will likely cause TypeScript errors in files importing changed component APIs — that's expected. Subsequent steps fix them.
- Do NOT fix feature files here; only fix `src/components/ui/` and `globals.css`.

**Demo:** Open `pnpm dev` — base components render with correct teal theme, no dark mode toggle.

---

## Step 2: Layout Shell — Navigation & Safe Zones

**Objective:** Mobile-first app shell with bottom tabs, minimal top bar, and safe zone compliance.

**Implementation guidance:**
1. Re-skin `src/components/layout/dashboard-bottom-tabs.tsx`:
   - Ensure `pb-[max(0px,env(safe-area-inset-bottom))]` on all nav variants
   - Verify rounded corners on any floating elements
   - Confirm all colors use token classes (`text-primary`, `text-muted-foreground`)
2. Re-skin `src/components/layout/dashboard-navbar.tsx`:
   - Minimal top bar for mobile: logo left, contextual actions right
   - Add `pt-[env(safe-area-inset-top)]` if using fixed positioning
3. Re-skin `src/components/layout/dashboard-sidebar.tsx` + `dashboard-shell.tsx`:
   - Desktop sidebar uses shadcn `Sidebar` component tokens
4. Re-skin `src/components/layout/public-shell.tsx` + `src/features/discovery/components/public-shell.tsx`:
   - Consistent with authenticated shell aesthetic
5. Re-skin remaining layout files:
   - `dashboard-layout.tsx`, `page-layout.tsx`, `container.tsx`
   - `portal-tabs-sidebar.tsx`, `portal-switcher.tsx`, `nav-user.tsx`
   - `sidebar-nav-item.tsx`
6. Evaluate `bento-grid.tsx` — keep if used, remove if only for old hero

**Test requirements:**
- `pnpm lint` passes
- Mobile viewport (375px): bottom tabs visible, safe area respected
- Desktop (1280px): sidebar visible, bottom tabs hidden

**Integration notes:**
- Layout changes affect every page. Verify no layout shifts on core routes.

**Demo:** Navigate player and owner routes on mobile — bottom tabs work, safe areas respected, top bar minimal.

---

## Step 3: Loading States — Kill All Loading Text

**Objective:** Replace all 45 loading text instances with spinner icons.

**Implementation guidance:**
1. Systematic find-and-replace across 26 files (see research/component-audit.md for full list)
2. Pattern replacements:
   - Button pending: `"Saving..."` → remove text, add `<Spinner />` before/after button label, keep button disabled
   - Page loading: `"Loading..."` → replace with `<Skeleton />` or `<Spinner />` centered
   - Form submit: `"Creating..."` / `"Submitting..."` → spinner icon in button, original label stays or is hidden
3. Ensure `Spinner` component from shadcn is used consistently
4. Common pattern for buttons:
   ```tsx
   <Button disabled={isPending}>
     {isPending && <Spinner />}
     Save
   </Button>
   ```
   NOT:
   ```tsx
   <Button disabled={isPending}>
     {isPending ? "Saving..." : "Save"}
   </Button>
   ```

**Test requirements:**
- `grep -rE "Loading\.\.\.|Creating\.\.\.|Saving\.\.\.|Updating\.\.\.|Deleting\.\.\.|Submitting\.\.\.|Processing\.\.\." src/` returns zero matches
- `pnpm lint` passes

**Integration notes:**
- This step is independent of visual theming — can be done in parallel with other steps.
- Pay attention to button width stability — spinner + text should not cause layout shift vs. text alone.

**Demo:** Trigger any form submission — button shows spinner icon, no text change.

---

## Step 4: Motion Removal — Migrate to CSS Animations

**Objective:** Remove `motion` library, replace all 9 usages with CSS animations.

**Implementation guidance:**
1. Migrate each file:
   - **Peek bars** (`mobile-manage-block-peek-bar.tsx`, `mobile-selection-peek-bar.tsx`): Replace `motion.div` with CSS `translate-y` + `transition-transform` or convert to shadcn `Drawer`
   - **Availability coordinators** (`availability-studio-coordinator.tsx`, `place-court-availability-coordinator.tsx`): Replace `AnimatePresence` + `motion.div` with CSS `animate-in`/`animate-out`
   - **Availability week grid** (`availability-week-grid.tsx`): Replace with CSS transition on grid items
   - **Court detail** (`court-detail-client.tsx`): Replace motion layout animation with CSS transition
   - **Time range picker** (`time-range-picker.tsx`): Replace with CSS transition
   - **PWA install prompt** (`pwa-install-prompt.tsx`): Replace with `animate-in slide-in-from-bottom`
   - **Shimmer** (`shimmer.tsx`): Replace with pure CSS `@keyframes` shimmer animation
2. Remove `motion` from `package.json`
3. Run `pnpm install`

**Test requirements:**
- `grep -r 'from "motion"' src/` returns zero matches
- `grep -r '"motion"' package.json` returns zero matches
- `pnpm lint` passes
- `TZ=UTC pnpm build` passes (no missing imports)

**Integration notes:**
- Booking studio peek bars may become shadcn Drawer components — coordinate with Step 10.
- Some animations may be simplified to no-animation if the CSS equivalent adds complexity without UX value.

**Demo:** Open availability studio, PWA prompt, court detail — transitions work smoothly without motion library.

---

## Step 5: Color Token Migration — Hardcoded Colors

**Objective:** Replace all hardcoded hex/rgba values with CSS variable token classes.

**Implementation guidance:**
1. **Non-chart files (12):** Replace hardcoded values with Tailwind token classes:
   - `#0D9488` / teal → `text-primary`, `bg-primary`
   - `#F97316` / orange → `text-accent`, `bg-accent`
   - `rgba(...)` backgrounds → `bg-muted`, `bg-card`, etc.
   - Per-file review needed — each has different context
2. **Logo** (`kudoscourts-logo.tsx`): Keep brand hex if SVG requires it, document as exception
3. **Navigation progress** (`navigation-progress.tsx`): Use `bg-primary` token
4. **Google sign-in** (`google-sign-in-button.tsx`): Keep Google brand colors (brand guideline requirement), document as exception

**Test requirements:**
- `grep -rE "rgba?\(|#[0-9a-fA-F]{3,8}" src/ --include="*.tsx"` returns only documented exceptions (OG images, Google brand, SVG logo)
- `pnpm lint` passes

**Integration notes:**
- OG images are handled in Step 12 — they require hex values since they're server-rendered without CSS.

**Demo:** Inspect any page — all colors resolve to CSS variable tokens in DevTools.

---

## Step 6: Empty States — Standardize on shadcn Empty

**Objective:** Unify all 14+ empty state patterns using shadcn `Empty` component.

**Implementation guidance:**
1. Audit all empty state files:
   - `src/components/kudos/empty-state.tsx` — replace usages with shadcn Empty
   - `src/components/availability-empty-state.tsx` — replace
   - `src/features/owner/components/courts-empty-state.tsx` — replace
   - `src/features/discovery/components/empty-results.tsx` — replace
   - Various inline empty states in page files
2. For each, apply the pattern:
   - Icon-based (Lucide) for primary empty states
   - Text-only for inline/secondary contexts
   - Always include an actionable CTA button
3. Remove redundant empty-state component files after migration
4. Ensure empty states are responsive (centered on mobile, reasonable max-width)

**Test requirements:**
- `pnpm lint` passes
- `TZ=UTC pnpm build` passes (no broken imports from removed files)
- All empty state locations render with consistent pattern

**Integration notes:**
- Some empty states are deeply embedded in feature pages — search for `EmptyState`, `empty-state`, and inline "No results" patterns.

**Demo:** View courts page with no results, reservations page with no bookings — consistent empty state with icon + CTA.

---

## Step 7: Auth & Onboarding — Re-skin + Copywriting

**Objective:** Re-skin auth flows and owner onboarding wizard. Apply /clarify copywriting pass.

**Implementation guidance:**
1. **Auth pages** (`src/features/auth/components/`):
   - `email-otp-form.tsx`: re-skin, clarify copy ("Enter the code we sent" not "Enter OTP")
   - `email-verification-screen.tsx`: re-skin, warm messaging
   - `magic-link-form.tsx`: re-skin
   - `google-sign-in-button.tsx`: keep Google brand, re-skin surrounding
   - Login/register pages: active CTAs ("Start Booking", "Set Up Your Venue")
2. **Onboarding wizard** (`src/features/owner/components/get-started/`):
   - `setup-wizard.tsx` + `wizard-step-layout.tsx`: shadcn Card shell, consistent step layout
   - `wizard-progress.tsx`: primary teal active state
   - `wizard-navigation.tsx`: spinner-only pending states
   - 7 step files: re-skin inputs/buttons, clarify copy
   - 12 overlay files (sheets/dialogs): reset to shadcn Sheet/Dialog
   - 6 section cards: consistent shadcn Card layout
   - `setup-stale-banner.tsx`, `setup-complete-banner.tsx`, `setup-error-banner.tsx`: shadcn Alert

**Test requirements:**
- `pnpm lint` passes
- Complete owner onboarding flow end-to-end — all steps functional
- All auth flows work (login, register, OTP, magic link)

**Integration notes:**
- Auth pages are under `src/app/(auth)/` — route structure unchanged.
- Onboarding business logic lives in hooks/providers — untouched.

**Demo:** Complete owner registration → onboarding wizard → all 7 steps → setup complete.

---

## Step 8: Player Flows — Discovery, Booking, Reservations

**Objective:** Re-skin all player-facing screens with consistent mobile-first design.

**Implementation guidance:**
1. **Discovery** (`src/features/discovery/`):
   - `hero-section.tsx`: strip heavy gradients, clean shadcn Card-based layout
   - `court-filters.tsx`, `place-filters-sheet.tsx`: shadcn Sheet + form controls
   - `court-map.tsx`: re-skin map overlays
   - `booking-card.tsx`: shadcn Card with teal accent
   - `photo-carousel.tsx`: shadcn Carousel
   - `contact-section.tsx`: replace hardcoded colors
   - `mobile-date-strip.tsx`: re-skin
   - `view-toggle.tsx`: shadcn Toggle
2. **Place detail** (`src/features/discovery/place-detail/`):
   - All 6 components: re-skin to shadcn Cards
   - `place-detail-mobile-sheet.tsx`: replace hardcoded colors
3. **Booking flow** (under `src/app/(auth)/courts/`, `src/app/(auth)/places/`):
   - Re-skin booking forms, payment screens
   - Ensure mobile-first layout (stacked, full-width inputs)
4. **Reservations** (`src/features/reservation/`):
   - `reservation-list.tsx`, `reservation-tabs.tsx`: re-skin
   - `booking-summary-card.tsx`, `payment-info-card.tsx`: shadcn Card
   - `cancel-dialog.tsx`: shadcn Dialog
   - `countdown-timer.tsx`: token colors
   - `profile-form.tsx`: shadcn Form, spinner-only pending
   - Error states: shadcn Empty pattern
   - Skeletons: verify token-consistent

**Test requirements:**
- `pnpm lint` passes
- Browse courts → select court → view schedule → book → view reservation → cancel
- All screens mobile-first, rounded corners, token colors

**Integration notes:**
- Heavy step — split by sub-feature if needed during implementation.
- Discovery hero is the most visible marketing surface — get this right.

**Demo:** Full player journey on mobile viewport: discover → book → manage.

---

## Step 9: Owner Flows — Dashboard, Courts, Settings

**Objective:** Re-skin all owner management screens.

**Implementation guidance:**
1. **Dashboard** (`src/features/owner/pages/owner-dashboard-page.tsx`): re-skin stats, overview
2. **Courts management**:
   - `owner-courts-page.tsx`, `owner-place-courts-page.tsx`: re-skin lists
   - `court-form.tsx`, `place-form.tsx`: shadcn Form, spinner-only pending
   - `court-hours-editor.tsx`, `court-pricing-editor.tsx`, `court-schedule-editor.tsx`: re-skin complex editors
   - `court-photo-upload.tsx`, `place-photo-upload.tsx`: re-skin upload UI
3. **Reservations management**:
   - `owner-reservations-page.tsx`, `owner-reservation-detail-page.tsx`: re-skin
   - `payment-proof-card.tsx`: shadcn Card
   - `reject-modal.tsx`, `confirm-dialog.tsx`: shadcn Dialog
4. **Settings** (`owner-settings-page.tsx`): re-skin form, spinner-only pending
5. **Team** (`owner-team-page.tsx`): re-skin
6. **Verification** (`owner-verification-landing-page.tsx`): re-skin
7. **Imports** (`owner-bookings-import-page.tsx`, `owner-bookings-import-review-view.tsx`): re-skin
8. **Availability studio** (`src/features/owner/components/availability-studio/`): re-skin, CSS animations
9. **Place court availability** (`src/features/owner/components/place-court-availability/`): re-skin

**Test requirements:**
- `pnpm lint` passes
- Owner can manage courts, view reservations, edit settings, manage team
- All forms submit with spinner-only pending

**Integration notes:**
- `stats-card.tsx`, `coming-soon-card.tsx`: straightforward shadcn Card re-skin
- Court config copy dialog, venue QR code dialog: shadcn Dialog

**Demo:** Owner dashboard → manage courts → edit pricing → view reservations.

---

## Step 10: Booking Studio — Full Redesign

**Objective:** Rebuild booking studio UI with shadcn primitives, preserve all business logic.

**Implementation guidance:**
1. **Preserve untouched:**
   - `booking-studio-provider.tsx` (context/state)
   - All hooks, types, and business logic
2. **Rebuild timeline items:**
   - `timeline-block-item.tsx`: shadcn Card-based, semantic color tokens for block types
   - `timeline-reservation-item.tsx`: shadcn Card-based, status-driven colors via tokens
3. **Rebuild interactions:**
   - `resize-handle.tsx`: CSS-only drag interaction (cursor styles, border highlight)
   - `draft-row-card.tsx`: shadcn Card
4. **Mobile patterns:**
   - `mobile-day-blocks-list.tsx`: shadcn Card list
   - `mobile-manage-block-peek-bar.tsx` → shadcn `Drawer` (bottom sheet)
   - `mobile-selection-peek-bar.tsx` → shadcn `Drawer` (bottom sheet)
   - `mobile-guest-form.tsx`: shadcn Form in Drawer
5. **Dialogs:**
   - `manage-block-dialog.tsx` → shadcn Dialog (desktop) / Drawer (mobile)
   - `replace-with-guest-dialog.tsx` → shadcn Dialog
   - `remove-block-dialog.tsx` → shadcn AlertDialog
   - `guest-booking-dialog.tsx` → shadcn Dialog / Drawer
   - `custom-block-dialog.tsx` → shadcn Dialog / Drawer
6. **Info display:**
   - `block-info-display.tsx`: clean layout with token colors

**Test requirements:**
- `pnpm lint` passes
- `TZ=UTC pnpm build` passes
- Create block, resize block, guest booking, remove block — all functional
- Mobile: drawer interactions work for peek bars
- Desktop: dialog interactions work

**Integration notes:**
- This is the highest-risk step. The booking studio has complex pointer-event handling.
- Test drag/resize interactions thoroughly on both touch and mouse.
- Provider layer must remain untouched — verify no state management changes.

**Demo:** Open booking studio → create block by drag → resize → add guest → remove block. Both mobile and desktop.

---

## Step 11: Analytics Charts — Token-based Theming

**Objective:** Re-theme all 11 charts + heatmap to use CSS variable tokens.

**Implementation guidance:**
1. For each chart in `src/features/owner/components/analytics/charts/`:
   - Update `ChartConfig` to use `var(--chart-N)` tokens instead of hardcoded hex
   - Verify `ChartContainer` wraps correctly
   - Ensure tooltip/legend styles use token classes
2. Charts to update:
   - `utilization-trend-chart.tsx`
   - `revenue-by-dow-chart.tsx`
   - `revenue-by-hour-chart.tsx`
   - `revenue-trend-chart.tsx`
   - `utilization-by-court-chart.tsx`
   - `lead-time-chart.tsx`
   - `response-time-chart.tsx`
   - `revenue-by-court-chart.tsx`
   - `bookings-by-hour-chart.tsx`
   - `cancellation-pie-chart.tsx`
   - `utilization-heatmap.tsx`
3. Re-skin chart container components:
   - `analytics-section.tsx`, `analytics-kpi-card.tsx`, `analytics-date-range-selector.tsx`
   - `revenue-tab.tsx`, `utilization-tab.tsx`, `operations-tab.tsx`

**Test requirements:**
- `pnpm lint` passes
- All charts render with token-based colors
- No hardcoded hex in chart files

**Integration notes:**
- Charts are lazy-loaded (owner-only). Verify dynamic import still works.

**Demo:** Owner analytics page — all charts display with teal/orange/green/amber/red brand palette.

---

## Step 12: Marketing Pages & OG Images

**Objective:** Re-skin all public marketing pages and OG image generators.

**Implementation guidance:**
1. **Marketing pages:**
   - `src/features/home/components/home-page-client.tsx`: strip heavy gradients, clean mobile-first layout
   - `src/features/home/components/home-search-form.tsx`: replace hardcoded colors
   - `src/features/home/components/welcome-header.tsx`: re-skin
   - `src/features/home/components/upcoming-reservations.tsx`: shadcn Card
   - `src/features/home/components/profile-completion-banner.tsx`: shadcn Alert/Card
   - About, blog, contact, cookies pages: verify token compliance
   - List-your-venue page: re-skin CTA sections
2. **OG images (server-rendered — hex values required):**
   - Define hex constants from brand palette:
     ```typescript
     const BRAND = {
       teal: "#0D9488",
       orange: "#F97316",
       background: "#FAF9F7",
       foreground: "#1C1917",
     } as const;
     ```
   - Update all OG image generators to use these constants
   - `src/app/opengraph-image.tsx`
   - `src/app/twitter-image.tsx`
   - `src/app/(public)/places/[placeId]/courts/[courtId]/opengraph-image.tsx`
   - `src/app/(public)/courts/[id]/opengraph-image.tsx`
   - `src/app/(public)/list-your-venue/opengraph-image.tsx`

**Test requirements:**
- `pnpm lint` passes
- Marketing pages render with consistent brand aesthetic
- OG images generate with teal + warm neutral palette

**Integration notes:**
- OG images can't use CSS variables — hex constants are the documented exception (AC-2).
- Home page hero is the highest-traffic marketing surface.

**Demo:** Landing page on mobile — clean, teal-branded, no gradient slop. Share a URL — OG image shows brand palette.

---

## Step 13: Polish Pass — Normalize, Clarify, Harden

**Objective:** Final consistency and quality pass across the entire app.

**Implementation guidance:**
1. **/normalize** — Design system consistency:
   - Verify padding/margin consistency across all Cards (p-4 or p-6, not mixed)
   - Verify heading hierarchy (h1 on pages, h2 in cards, h3 in sections)
   - Verify button sizing consistency (default size for primary actions, sm for secondary)
   - Verify input heights consistent
   - Remove any remaining `dark:` prefixes in component files
2. **/clarify** — Copywriting:
   - Review all button labels for active voice
   - Review all error messages for friendly, actionable tone
   - Review all empty state messages for contextual CTAs
   - Review all form labels and placeholders
   - Ensure no "Loading..." text crept back in
3. **/harden** — Resilience:
   - Verify all forms handle error states gracefully
   - Verify text overflow handling in Cards and Tables (truncate or wrap)
   - Verify long content doesn't break mobile layouts
   - Check all dialogs/sheets have proper close affordances on mobile
4. **/polish** — Final alignment:
   - Verify `--radius` applied consistently (rounded-lg on Cards, rounded-md on inputs)
   - Verify spacing gaps are consistent (gap-4 or gap-6, not random)
   - Verify typography scale matches globals.css base definitions
   - Remove any orphaned CSS classes, unused custom animations

**Test requirements:**
- `pnpm lint` passes
- `TZ=UTC pnpm build` passes
- Full manual walkthrough on mobile (375px) and desktop (1280px)

**Integration notes:**
- This is a sweep, not a feature. Touch many files lightly rather than deep-diving a few.

**Demo:** Full app walkthrough — every screen feels cohesive, polished, mobile-first.

---

## Step 14: Validation & Verification

**Objective:** Verify all acceptance criteria pass before merge.

**Implementation guidance:**
1. Run automated checks:
   ```bash
   # AC-1: Lint
   pnpm lint

   # AC-2: No hardcoded colors (excluding documented exceptions)
   grep -rE "rgba?\(|#[0-9a-fA-F]{3,8}" src/ --include="*.tsx" | grep -v opengraph | grep -v twitter-image | grep -v google-sign-in | grep -v kudoscourts-logo

   # AC-3: No loading text
   grep -rE "Loading\.\.\.|Creating\.\.\.|Saving\.\.\.|Updating\.\.\.|Deleting\.\.\.|Submitting\.\.\.|Processing\.\.\." src/

   # AC-4: No motion
   grep -r '"motion"' package.json
   grep -r 'from "motion"' src/

   # AC-5: No dark mode
   grep "\.dark" src/app/globals.css

   # AC-10: Build
   TZ=UTC pnpm build
   ```
2. Manual verification checklist:
   - [ ] Landing page: mobile + desktop
   - [ ] Auth: login, register, OTP, magic link
   - [ ] Player: discover → book → pay → view reservation → cancel
   - [ ] Owner: get-started wizard (all 7 steps)
   - [ ] Owner: booking studio (create, resize, guest, remove)
   - [ ] Owner: analytics charts
   - [ ] Owner: court management (create, edit, hours, pricing)
   - [ ] Admin: dashboard, claims, verification
   - [ ] Bottom tabs: all roles on mobile
   - [ ] Safe areas: iOS simulator or real device
   - [ ] Empty states: at least 3 different contexts
   - [ ] OG images: share URL, verify preview

**Test requirements:**
- All 12 acceptance criteria from design.md pass
- Zero lint errors, zero build errors

**Integration notes:**
- This is the gate before merge to main.
- If any AC fails, loop back to the relevant step.

**Demo:** Everything works. Ship it.
