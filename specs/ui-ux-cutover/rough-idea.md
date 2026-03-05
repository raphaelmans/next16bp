# Rough Idea

## Source
Derived from `.opencode/plans/1772731283296-mighty-squid.md` (Full System UI/UX Cutover & Revamp Plan).

## Core Concept
Hard cutover of the entire design system and UI layer to strictly use Radix shadcn-ui components, retaining the primary teal color theme. The app is a **mobile-first PWA** for court/venue booking (KudosCourts).

## Key Constraints
- Mobile-first: all designs start from mobile viewport, progressively enhance to desktop
- PWA: must work offline-capable, installable, touch-optimized
- Retain primary teal (`oklch(0.58 0.11 175)` / `~#0D9488`)
- Standardize on shadcn-ui components exclusively
- Replace all hardcoded color values with CSS variable tokens
- Preserve all existing functionality during cutover

## Gap Analysis (from existing plan)
See `research/gap-analysis.md` for the 10 identified gaps against the original plan.
