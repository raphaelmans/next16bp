# UI/UX Cutover & Revamp

## Objective

Big-bang cutover of the entire UI layer to shadcn-ui components on a dedicated branch. Mobile-first PWA, light-only, primary teal retained. ~280 files, 14 steps.

## Key Requirements

- Reset all 47 shadcn primitives to latest via `npx shadcn@latest add --overwrite`
- Remove `motion` dependency, migrate 9 files to CSS animations (tailwindcss-animate)
- Remove dark mode (`.dark` block in globals.css, `dark:` variants)
- Replace all hardcoded hex/rgba with CSS variable tokens (27 files)
- **CRITICAL: No loading text anywhere.** Replace all "Loading...", "Saving...", "Creating..." etc. with spinner icons only (45 instances, 26 files)
- **[DONE] Remove orange from design system entirely:** `--accent` changed to subtle warm neutral. Orange tokens removed. All former orange use cases remapped to `primary` (teal) or semantic tokens. 98 files updated.
- **[DONE] Overhaul ALL interactive state colors:** Accent token fix cascaded to all 13 shadcn components. All hardcoded `amber-*` → `warning`/`warning-light` tokens, `green-*`/`emerald-*` → `success`/`success-light` tokens, `orange-*` → semantic equivalents, `red-*` → `destructive`/`destructive-light` tokens. All `dark:` variants stripped (light-only). Badge component extended with `success`, `warning`, `paid` variants. Booking slot types use semantic color palette: available=success, booked=primary, walkin=warning, guest=secondary, maintenance=muted.
- Full /clarify copywriting pass — active voice, friendly errors, contextual CTAs
- Full /normalize + /polish pass — consistent spacing, radius, typography
- Safe zones: `env(safe-area-inset-*)` on all fixed elements
- Rounded corners everywhere via `--radius: 0.75rem`
- Booking studio: full UI redesign, preserve business logic and provider/state layer
- Onboarding wizard (33 files): re-skin all steps + overlays
- Empty states (14+): standardize on shadcn Empty with icon + CTA
- Charts (11): replace hardcoded hex with `var(--chart-N)` tokens
- OG images (5): re-skin to teal + warm neutrals (hex constants OK, documented exception)
- Marketing pages: strip gradient slop, clean mobile-first layout

## Acceptance Criteria

- **Given** `pnpm lint` runs **Then** zero errors
- **Given** `TZ=UTC pnpm build` runs **Then** zero TypeScript errors
- **Given** all `.tsx` files searched for `Loading...|Creating...|Saving...|Updating...|Deleting...|Submitting...|Processing...` **Then** zero matches
- **Given** `package.json` **Then** `motion` is not in dependencies and no files import from `"motion"`
- **Given** `globals.css` **Then** no `.dark` block exists
- **Given** hardcoded color search `rgba?\(|#[0-9a-f]{3,8}` **Then** only OG images, Google sign-in button, and SVG logo contain hex (documented exceptions)
- **Given** all fixed-position elements on iOS **Then** safe areas respected
- **Given** booking studio operations (create, resize, guest, remove) **Then** all functional post-redesign
- **Given** owner onboarding wizard **Then** all 7 steps complete successfully
- **[PASS]** `--accent` in globals.css is `oklch(0.96 0.005 90)` — subtle warm neutral
- **[PASS]** Zero matches for orange hex/oklch values across all CSS and TSX
- **[PASS]** Zero matches for hardcoded Tailwind color classes (`orange-|amber-|green-|emerald-|red-`) in TSX files. All replaced with design tokens. `dark:` variants stripped. Documented exceptions: notification-bell (bg-destructive for badge), speech-input (border-destructive/30 for pulse), code-block (shiki dark theme).
- **[PASS]** Badge component includes `success`, `warning`, `paid` semantic variants
- **Given** mobile viewport (375px) **Then** bottom tab bar visible with role-appropriate tabs

## Spec Reference

All design decisions, architecture, component audit, and step-by-step plan: `specs/ui-ux-cutover/`

## Suggested Command

```bash
ralph run --config presets/pdd-to-code-assist.yml
```
