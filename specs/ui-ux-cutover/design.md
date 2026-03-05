# UI/UX Cutover & Revamp — Detailed Design

## 1. Overview

Hard cutover of the KudosCourts design system to a clean, mobile-first PWA interface built exclusively on shadcn-ui components. The existing design system is removed; only the primary teal brand color is retained. All work happens on a dedicated branch and ships as a single release.

**Core principles:**
- Mobile-first: every screen designed for phone viewport first, progressively enhanced to desktop
- Speed: fast page loads, no heavy animation libraries, CSS-only transitions
- Consistency: one design language across all surfaces — app, marketing, OG images
- No loading text: spinner icons only, everywhere, always

---

## 2. Detailed Requirements

### 2.1 Design System Foundation
- Remove existing design system entirely
- Reset all shadcn-ui primitives to latest registry versions via shadcn MCP
- Single source of truth: `globals.css` CSS variables + `components.json`
- Light mode only — remove `.dark` block from globals.css
- Primary teal: `oklch(0.58 0.11 175)` (~#0D9488)
- Accent orange: `oklch(0.7 0.18 45)` (~#F97316)
- Extended tokens retained: `--success`, `--warning`, `--destructive-light`
- Radius: `--radius: 0.75rem` (rounded corners enforced globally)
- Typography: Outfit (headings), Source Sans 3 (body), IBM Plex Mono (mono)

### 2.2 Mobile-First PWA
- All layouts start from mobile viewport, use Tailwind responsive prefixes (`md:`, `lg:`) to enhance
- Bottom tab bar for primary navigation (already exists, re-skin only)
- Safe area insets: `env(safe-area-inset-top)`, `env(safe-area-inset-bottom)` on all fixed elements
- Rounded corners on all cards, dialogs, sheets, inputs
- Touch-optimized: shadcn default sizing for interactive elements

### 2.3 Component Strategy
- **shadcn registry components (47):** Reset to latest via `npx shadcn@latest add --overwrite`
- **Truly custom components (2):** `page-header`, `draggable-panel` — re-skin to match token system
- **Non-UI directories:** Re-skin `src/components/kudos/`, `ai-elements/`, `navigation/`, `layout/`
- **Feature components (90+):** Update imports if APIs change, replace hardcoded colors

### 2.4 Animation
- Remove `motion` (Framer Motion) dependency from `package.json`
- Migrate 9 files using `motion` to CSS animations via `tailwindcss-animate`
- Peek bars, availability grids: use CSS `transform` + `transition`
- PWA install prompt: use `animate-in`/`animate-out` from tw-animate-css
- Shimmer effect: pure CSS keyframe animation

### 2.5 Loading States (CRITICAL)
- Zero tolerance for loading text ("Loading...", "Creating...", "Saving...", etc.)
- All 45 instances across 26 files replaced with `<Spinner />` or equivalent icon
- Button pending states: show spinner icon inline, disable button
- Page loading states: use shadcn `Skeleton` components
- Form submission: spinner icon in submit button, no text change

### 2.6 Color Token Migration
- 11 chart files: replace hardcoded hex with `var(--chart-N)` via `ChartConfig`
- 4-5 OG image files: re-skin to teal + warm neutrals palette
- 12 other files: replace hardcoded `rgba()` / hex with semantic CSS variable classes

### 2.7 Copywriting & Clarity
- Full /clarify pass on all user-facing copy
- Auth flows: active, brand-aligned propositions ("Start Booking" not "Create Account")
- Error messages: warm, actionable ("Check your connection and try again" not "Network Error")
- Empty states: contextual CTAs, not dead ends
- Cooldown/rate-limit messages: friendly tone

### 2.8 Scope Boundaries
**In scope:**
- All app screens (player, owner, admin)
- Marketing pages (landing, about, list-your-venue, blog, contact)
- OG images and Twitter cards
- Booking studio (full redesign, preserve business logic)
- Onboarding wizard (7 steps + 12 overlays)
- All empty states (14+ patterns)
- All loading states

**Out of scope:**
- Backend / tRPC routers / API contracts
- Database schema
- Business logic (domain.ts, helpers.ts)
- Auth integration (Supabase auth stays, UI re-skin only)
- Route structure (URLs unchanged)
- Third-party integrations (Stream Chat, Supabase Storage)

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    globals.css                           │
│  :root { CSS Variables } → @theme inline { Tailwind }   │
│  (Single source of truth for all tokens)                │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼────────┐     ┌─────────▼─────────┐
│  shadcn-ui     │     │  Custom Components │
│  (47 reset     │     │  page-header       │
│   primitives)  │     │  draggable-panel   │
└───────┬────────┘     └─────────┬──────────┘
        │                        │
        └────────────┬───────────┘
                     │
    ┌────────────────┼────────────────────┐
    │                │                    │
┌───▼────┐    ┌──────▼──────┐    ┌───────▼───────┐
│ Layout │    │  Features   │    │  Marketing    │
│ Shell  │    │  90+ files  │    │  Pages + OG   │
│ + Tabs │    │  (re-skin)  │    │  (re-skin)    │
└────────┘    └─────────────┘    └───────────────┘
```

### Token Flow
1. `globals.css` `:root` defines CSS custom properties (oklch values)
2. `@theme inline` maps them to Tailwind color utilities (`bg-primary`, `text-muted-foreground`)
3. shadcn components consume tokens via Tailwind classes
4. Charts consume tokens via `ChartConfig` referencing `var(--chart-N)`
5. OG images reference hex equivalents of the same palette (server-rendered, no CSS vars)

### Navigation Architecture (Mobile)
```
┌─────────────────────────────────┐
│  Minimal Top Bar                │
│  [Logo]              [Actions]  │
├─────────────────────────────────┤
│                                 │
│         Page Content            │
│         (scrollable)            │
│                                 │
├─────────────────────────────────┤
│  Bottom Tab Bar                 │
│  [Tab] [Tab] [Tab] [Tab/More]  │
│  ─── safe-area-inset-bottom ─── │
└─────────────────────────────────┘
```

- **Player:** Courts / Reservations / Home / Saved
- **Owner (setup incomplete):** Get Started / Studio / Venues / More
- **Owner (setup complete):** Reservations / Studio / Venues / More
- **Admin:** Dashboard / Claims / Verify / Courts / Venues
- Desktop (md+): sidebar navigation, bottom tabs hidden

---

## 4. Components and Interfaces

### 4.1 shadcn Reset List
All 47 components reset to latest via shadcn CLI with `--overwrite`:

```
accordion alert alert-dialog aspect-ratio avatar badge breadcrumb
button button-group calendar card carousel chart checkbox
collapsible command context-menu dialog drawer dropdown-menu
empty field form hover-card input input-group input-otp
item kbd label menubar navigation-menu pagination popover
progress radio-group resizable scroll-area select separator
sheet sidebar skeleton slider sonner spinner switch table
tabs textarea toggle toggle-group tooltip
```

After reset, customize globals.css tokens to align theming.

### 4.2 Custom Component Contracts

**PageHeader** (keep, re-skin)
```typescript
interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItemType[];
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
}
```
Changes: ensure heading uses `font-heading`, all colors from tokens, mobile-responsive layout.

**DraggablePanel** (keep, re-skin)
```typescript
interface DraggablePanelProps {
  children: React.ReactNode;
  header: React.ReactNode;
  storageKey?: string;
  defaultPosition?: { x: number; y: number };
}
```
Changes: use `bg-card`, `border`, `shadow-md`, `rounded-lg` tokens only.

### 4.3 Booking Studio Redesign

The booking studio is rebuilt with shadcn primitives while preserving all business logic.

**Current structure (10+ components):**
- `booking-studio-provider.tsx` — context/state (PRESERVE)
- `timeline-block-item.tsx` — visual block in timeline
- `timeline-reservation-item.tsx` — reservation in timeline
- `resize-handle.tsx` — drag handle for block resize
- `draft-row-card.tsx` — pending block card
- `mobile-day-blocks-list.tsx` — mobile list view
- `mobile-manage-block-peek-bar.tsx` — bottom peek bar (uses `motion`)
- `mobile-selection-peek-bar.tsx` — selection peek bar (uses `motion`)
- `manage-block-dialog.tsx` — block CRUD dialog
- `replace-with-guest-dialog.tsx` — guest replacement
- `remove-block-dialog.tsx` — deletion confirmation
- `block-info-display.tsx` — block detail display
- `guest-booking-dialog.tsx` — guest booking form
- `custom-block-dialog.tsx` — custom block form
- `mobile-guest-form.tsx` — mobile guest entry

**Redesign approach:**
- Provider/state layer: untouched (business logic preserved)
- Timeline items: rebuilt with shadcn `Card` + semantic color tokens
- Resize handle: CSS-only interaction (no `motion`)
- Peek bars: CSS `transform` + `transition` replacing `motion` animations
- Dialogs: standard shadcn `Dialog` / `Drawer` (mobile) pattern
- Mobile: use `Drawer` for bottom-sheet patterns instead of custom peek bars

### 4.4 Onboarding Wizard

**7 wizard steps + 12 overlays** under `src/features/owner/components/get-started/`

Steps: org → venue → courts → config → payment → verify → complete

**Approach:**
- Wizard shell (`setup-wizard.tsx`): shadcn `Card` with step progress
- Step layout (`wizard-step-layout.tsx`): consistent padding, heading, CTA
- Overlays (sheets/dialogs): reset to shadcn `Sheet` / `Dialog`
- Progress (`wizard-progress.tsx`): shadcn styling with primary teal active state
- Navigation (`wizard-navigation.tsx`): shadcn `Button` with spinner-only pending
- Section cards (6): shadcn `Card` with consistent layout
- All "Get Started" CTA badges: primary teal

### 4.5 Empty States

Standardize using the shadcn `Empty` component family:
```tsx
<Empty>
  <EmptyMedia variant="icon">
    <CalendarDays />
  </EmptyMedia>
  <EmptyHeader>
    <EmptyTitle>No reservations yet</EmptyTitle>
    <EmptyDescription>
      Book a court to get started
    </EmptyDescription>
  </EmptyHeader>
  <Button>Find Courts</Button>
</Empty>
```

Apply across all 14+ empty state locations. Use icon variant for primary states, text-only for inline/secondary contexts.

---

## 5. Data Models

No data model changes. This is a UI-only cutover. All database schemas, tRPC contracts, and business logic remain untouched.

---

## 6. Error Handling

### UI Error States
- Use shadcn `Alert` (variant="destructive") for inline errors
- Use `sonner` toast for transient errors
- Form validation: shadcn `Form` with field-level error display
- Network errors: friendly message + retry CTA, no technical details
- 404/not-found: custom pages with shadcn `Empty` pattern + navigation CTA

### Loading Error Recovery
- Failed data fetches: show error state with retry button (spinner icon on retry, no text)
- Optimistic updates that fail: revert + toast notification

---

## 7. Acceptance Criteria

### AC-1: Design System Reset
- **Given** a fresh checkout of the cutover branch
- **When** `pnpm lint` runs
- **Then** zero lint errors

### AC-2: No Hardcoded Colors
- **Given** all `.tsx` files in `src/`
- **When** searched for `rgba(`, `#[0-9a-f]{3,8}` patterns
- **Then** only OG image files (server-rendered, no CSS var support) contain hex values; all others use CSS variable classes or `var(--token)` references

### AC-3: No Loading Text
- **Given** all `.tsx` files in `src/`
- **When** searched for `Loading...`, `Creating...`, `Saving...`, `Updating...`, `Deleting...`, `Submitting...`, `Processing...`
- **Then** zero matches found

### AC-4: No motion Dependency
- **Given** `package.json`
- **When** checked for `motion` in dependencies
- **Then** `motion` is not listed
- **And** no files import from `"motion"`

### AC-5: Light Mode Only
- **Given** `globals.css`
- **When** inspected
- **Then** no `.dark` block exists
- **And** no `dark:` variant usage in component files (except shadcn internals if needed)

### AC-6: Safe Area Compliance
- **Given** all fixed-position elements (bottom tabs, top bar, sheets)
- **When** rendered on an iPhone with notch/dynamic island
- **Then** content does not overlap safe areas
- **And** `env(safe-area-inset-*)` is applied on all fixed edges

### AC-7: shadcn Component Purity
- **Given** `src/components/ui/` directory
- **When** compared to shadcn registry
- **Then** all registry components match latest shadcn versions (minus theme customization)
- **And** only `page-header.tsx` and `draggable-panel.tsx` are non-registry files

### AC-8: Booking Studio Functional Parity
- **Given** the redesigned booking studio
- **When** all existing booking operations are performed (create block, resize, guest booking, remove)
- **Then** all operations succeed identically to pre-cutover behavior

### AC-9: Onboarding Wizard Functional Parity
- **Given** the re-skinned onboarding wizard
- **When** a new owner completes all 7 steps
- **Then** organization, venue, courts, config, payment, and verification are set up correctly

### AC-10: Build Success
- **Given** the cutover branch
- **When** `TZ=UTC pnpm build` runs
- **Then** build completes with zero TypeScript errors

### AC-11: Rounded Corners
- **Given** all Card, Dialog, Sheet, Input, Button components
- **When** rendered
- **Then** all use `--radius` token for consistent rounded corners

### AC-12: Bottom Tab Bar
- **Given** authenticated mobile viewport (<768px)
- **When** navigating the app
- **Then** bottom tab bar is visible with role-appropriate tabs
- **And** safe area inset is applied below tabs

---

## 8. Testing Strategy

### Validation Pipeline
Since no test runner is configured, validation uses:

1. **`pnpm lint`** — Biome check for syntax/formatting errors
2. **`TZ=UTC pnpm build`** — TypeScript compilation + Next.js build (catches type errors, missing imports, broken routes)
3. **Manual grep checks:**
   - `grep -r "Loading\.\.\." src/` → must return zero
   - `grep -r "from \"motion\"" src/` → must return zero
   - `grep -r "\.dark" src/app/globals.css` → must return zero

### Visual Verification
- Run `pnpm dev` and manually verify:
  - Landing page / hero
  - Auth pages (login, register, OTP)
  - Player: discover, court detail, booking flow, reservations
  - Owner: get-started wizard, booking studio, analytics charts, settings
  - Admin: dashboard, claims, verification
  - All on mobile viewport (375px) first, then desktop

### Regression Checkpoints
For booking studio redesign:
- Create a block → verify persistence
- Resize a block → verify time boundaries update
- Guest booking → verify reservation created
- Remove block → verify deletion
- Mobile peek bar interactions → verify sheet/drawer opens

---

## 9. Appendices

### A. Technology Choices

| Decision | Choice | Rationale |
|---|---|---|
| Component library | shadcn-ui (latest, new-york style) | Project standard, Radix primitives |
| Animation | tailwindcss-animate (CSS only) | Bundle size, speed philosophy |
| Charts | Recharts + shadcn ChartContainer | Already integrated, token-compatible |
| Icons | Lucide | shadcn default, already used |
| Forms | React Hook Form + Zod + shadcn Form | Already integrated |
| Theming | CSS custom properties (oklch) | Modern, shadcn-native approach |

### B. Research Findings

- 47 shadcn components to reset (including 7 that appeared custom but are registry)
- 2 truly custom components to re-skin
- 9 files importing `motion` to migrate
- 27 files with hardcoded colors to fix
- 45 loading text instances across 26 files to replace
- Dark mode block in globals.css to remove
- Bottom tab bar already has safe area + role logic — re-skin only
- `components.json` baseColor is "slate" — keep, as theming is via CSS vars not base color

### C. Alternative Approaches Considered

1. **Incremental cutover** — Rejected. User prefers big-bang for visual consistency.
2. **Keep motion library** — Rejected. Speed philosophy demands lighter bundle.
3. **Dark mode support** — Deferred. Light-only ships first; token system supports future addition.
4. **Booking studio defer** — Rejected. Full redesign included for consistency.
5. **Custom touch targets (44px+)** — Not adopted. shadcn defaults kept; safe zones enforced instead.

### D. File Impact Summary

| Category | Files | Action |
|---|---|---|
| shadcn UI components | 47 | Reset via CLI |
| Custom UI components | 2 | Re-skin |
| motion imports | 9 | Migrate to CSS |
| Hardcoded colors | 27 | Token replacement |
| Loading text | 26 | Replace with spinners |
| globals.css | 1 | Remove dark mode, verify tokens |
| Layout components | ~14 | Re-skin |
| Feature components | ~90 | Update if APIs change |
| OG images | 4-5 | Re-skin palette |
| Marketing pages | ~6 | Full /harden + /clarify pass |
| Onboarding wizard | ~33 | Re-skin + /clarify |
| Booking studio | ~15 | Full redesign (UI only) |
| Empty states | ~14 | Standardize on shadcn Empty |
| **Total estimated files touched** | **~280** | |
