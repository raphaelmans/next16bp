# Requirements

## Q&A Record

### Q1: Cutover Strategy — Incremental or Big-Bang?

The codebase has 90+ files importing custom UI components (`<Empty>`, `<Field>`, `<Spinner>`, `<ButtonGroup>`, etc.). Two approaches:

- **Incremental:** Replace one component at a time across the codebase, keeping both old and new working. Lower risk, longer duration. Can ship partial progress.
- **Big-bang:** Replace everything in one pass (likely a dedicated branch). Higher risk, but ensures visual consistency from day one. Nothing ships until it's all done.

Given this is a mobile-first PWA with live users, which approach do you prefer?

**Answer:** Big-bang. Remove the existing design system entirely, retain only the primary teal color. Everything ships at once on a dedicated branch.

---

### Q2: Touch Target & Mobile Interaction Standards

Since this is a mobile-first PWA, touch interactions are critical. What's your expectation for minimum touch targets?

- **Apple HIG standard:** 44x44pt minimum (recommended for iOS PWAs)
- **Material Design:** 48x48dp minimum
- **Current shadcn defaults:** ~36px for most buttons/inputs — likely too small for thumb-friendly mobile use

This affects every interactive element: buttons, form inputs, list items, tabs, toggles, calendar cells in the booking flow. Do you want to enforce a minimum (e.g., 44px) across the board, or keep shadcn defaults and only upsize for key flows (booking, onboarding)?

**Answer:** Keep shadcn defaults for touch targets. Ensure safe zones (notch/home indicator padding) are respected. Use rounded corners consistently throughout.

---

### Q3: Booking Studio — Redesign or Preserve?

The booking studio (`src/features/owner/components/booking-studio/`) is the most complex interactive UI in the app — drag-to-create blocks, resize handles, timeline views with horizontal scrolling. It has 10+ custom components that don't map cleanly to any shadcn primitive.

Options:
- **Preserve as-is:** Only re-skin colors/tokens to match the new system, but keep the custom interaction logic untouched. Lower risk.
- **Full redesign:** Rebuild using shadcn primitives where possible (Cards, Popovers, etc.) and simplify the mobile experience. Higher risk but more cohesive.
- **Defer:** Exclude from this cutover entirely, tackle as a separate effort.

This is an owner-only feature (not player-facing), so it has a smaller audience but is used daily by venue managers.

**Answer:** Full redesign. Business logic and any existing unit tests must be retained and working. UI layer gets rebuilt with shadcn, logic layer stays intact.

---

### Q4: Animation Strategy — motion (Framer) vs. tailwindcss-animate?

The project currently has `motion` v12 (Framer Motion successor) installed. shadcn components ship with `tailwindcss-animate` for their built-in transitions (dialog open/close, accordion expand, etc.).

You have two libraries doing similar things. Options:
- **motion only:** Use `motion` for everything — page transitions, micro-interactions, component enter/exit. Remove `tailwindcss-animate` usage. More powerful but heavier bundle.
- **tailwindcss-animate only:** Use CSS-only animations via Tailwind. Remove `motion`. Lighter bundle, but limited (no spring physics, gesture-driven animations, layout animations).
- **Hybrid:** `tailwindcss-animate` for shadcn component internals (already wired), `motion` for page transitions and complex interactions (booking studio drag, onboarding wizard steps). Clear boundary.

Which approach?

**Answer:** tailwindcss-animate only. Remove `motion` from dependencies entirely. Fast page load and speed is a core philosophy — CSS-only animations keep bundle light.

---

### Q5: Navigation Pattern — Bottom Nav, Top Nav, or Sidebar?

Mobile-first PWAs typically use a bottom navigation bar for primary navigation (like native apps). Currently the app has:
- A top navbar with sidebar drawer for authenticated routes
- Public routes use a different shell (`public-shell.tsx`)

For a mobile-first PWA, the common patterns are:
- **Bottom tab bar** (iOS/Android native feel): Primary actions always reachable by thumb. Top bar becomes minimal (logo + contextual actions only).
- **Top nav + hamburger** (current): Familiar web pattern, but less thumb-friendly on tall phones.
- **Keep current, just re-skin:** Lowest effort, but misses the mobile-first opportunity.

Given this is a PWA meant to feel app-like, what's your preference?

**Answer:** Bottom tab bar. Native app feel with primary actions always thumb-reachable. Minimal top bar for logo + contextual actions.

---

### Q6: User Roles and Tab Bar Items

The app has two distinct user roles with different primary workflows:

- **Players** (public/reservation users): Discover courts, book, manage reservations, profile
- **Owners** (venue managers): Manage bookings, courts, analytics, onboarding/setup

Should each role have its own bottom tab bar with different items, or one shared bar with conditional items? And what are the ~4-5 primary tabs per role?

For example:
- **Player tabs:** Home / Discover / My Bookings / Profile
- **Owner tabs:** Dashboard / Bookings / Courts / Analytics / Settings

What tabs make sense for each role?

**Answer:** One consistent bottom tab bar for both roles. Same structure, content adapts based on role context.

---

### Q7: What are the tab items?

Existing bottom tabs already handle role adaptation:
- **Player:** Courts / Reservations / Home / Saved
- **Owner:** Reservations (swaps to Get Started when incomplete) / Studio / Venues / More
- **Admin:** Dashboard / Claims / Verify / Courts / Venues

**Answer:** Keep existing tab structure — it already implements get-started priority and role-based adaptation. Re-skin to match new design system.

---

### Q8: Empty States & Illustrations

The app has 14+ files using empty-state patterns across features (courts, reservations, chat, availability, discovery). The original plan says "replace dead-end empty states with actionable Card or EmptyState patterns."

Options:
- **Text-only:** Clean text + CTA button, no illustrations. Minimal, fast to implement.
- **Icon-based:** Lucide icons as visual anchors + text + CTA. Consistent with the rest of the icon system.
- **Illustrated:** Custom SVG illustrations per context. Most polished but requires design assets.

What level of polish for empty states?

**Answer:** Hybrid — icon-based (Lucide) for primary empty states where visual anchor helps (e.g., no reservations, no courts), text-only for simpler/inline contexts. Case-by-case judgment.

---

### Q9: Dark Mode Support

shadcn-ui has built-in dark mode via CSS variables. The cutover is a natural time to decide:

- **Light only:** Single theme, simpler. Fewer tokens to maintain. Most PWAs in the sports/booking space are light-only.
- **Dark + Light:** User toggleable or system-preference based. More polished but doubles QA surface for every screen.
- **Defer:** Ship light-only now, add dark mode as a follow-up since the shadcn token system makes it straightforward later.

What's your preference?

**Answer:** Light only. Remove dark mode tokens/classes if present. Can add later since shadcn token system supports it.

---

### Q10: OpenGraph Images & Marketing Pages

There are 4 OG image generators using hardcoded hex colors, plus marketing pages (home hero, list-your-venue, about, blog). The original plan calls out "AI slop" and heavy gradients on the home hero.

Two questions:
1. **OG images:** Re-skin to use primary teal + neutral palette, or redesign entirely?
2. **Marketing pages (landing, about, list-your-venue):** Are these in scope for this cutover, or should we focus on the app experience and defer marketing pages?

**Answer:** All in scope. OG images re-skinned to teal + neutrals. Marketing pages included — full harden pass across everything. No deferral.

---

### Q11: Charts

Already using Recharts + shadcn `ChartContainer`/`ChartConfig` wrapper — the recommended shadcn approach. Fix is replacing hardcoded hex colors with CSS variable tokens in chart configs.

**Answer:** Keep Recharts + shadcn chart wrapper. Replace hardcoded hex with CSS variable tokens only.

---

### Q12: Scope Boundary — What's NOT Changing?

To make sure we don't scope-creep, confirming these are **out of scope**:
- Backend / API / tRPC routers (no server-side changes)
- Database schema
- Business logic in domain.ts / helpers.ts files
- Auth flows (Supabase auth integration stays, just UI re-skin)
- Route structure (URLs stay the same)
- Third-party integrations (Stream Chat, Supabase Storage)

Is there anything else you want to explicitly include or exclude?

**Answer:** Confirmed — backend and business logic stay untouched. Full /normalize and /polish pass across everything for consistency.

**CRITICAL UX RULE:** No "Loading...", "Creating...", "Saving..." text in the UI. Use loading state icons (spinners) only — never loading text. This applies globally to all buttons, forms, page states, and transitions. This is a hard requirement.

Additionally, /clarify pass on all copywriting for consistency across the app.

---

### Q13: shadcn Component Reset & Theming

Use shadcn MCP to reset all UI primitives to latest shadcn defaults, then customize theming to align with the design system (primary teal, light-only, rounded corners). This ensures:
- All components start from a clean, up-to-date shadcn baseline
- No legacy customizations or drift from shadcn defaults
- Theme tokens (CSS variables) are the single source of truth
- Custom non-shadcn components (`button-group`, `spinner`, `field`, `empty`, `page-header`, `kbd`, `item`, `input-group`, `draggable-panel`) are either replaced with shadcn equivalents or rebuilt on shadcn primitives

**Answer:** Confirmed. Reset shadcn primitives via MCP, update theming to align with design system. shadcn is the component source of truth.
