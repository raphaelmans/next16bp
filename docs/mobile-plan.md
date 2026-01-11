# Mobile React Native Support Plan (iOS/Android)

## Scope
- Build a native mobile app using Expo (iOS/Android only).
- Keep existing web app intact.
- Use `nativewind` + `react-native-reusables` for shadcn-style components.
- Keep Supabase for auth/data.
- Use OpenAPI-generated client for mobile API access.

## Assumptions
- Monorepo structure with `apps/web`, `apps/mobile`, `packages/shared`.
- Expo Router for navigation.
- React Query for data caching.
- Zustand for client state.

## Proposed Stack
- Framework: `expo`, `expo-router`
- Styling: `nativewind`, `tailwindcss`
- Components: `react-native-reusables`
- State/Data: `@tanstack/react-query`, `zustand`
- Forms/Validation: `react-hook-form`, `zod`
- Auth/Storage: `@supabase/supabase-js`, `expo-secure-store`
- Build/Release: `eas-cli`, `expo-updates`

## Architecture Overview
```
apps/
  web/              # Next.js app (current)
  mobile/           # Expo app
packages/
  shared/           # zod schemas, types, utilities
```

## Phase 1 — Monorepo Setup
- Move current app into `apps/web`.
- Create `apps/mobile` (Expo Router template).
- Create `packages/shared` for:
  - API schemas/types
  - Zod models
  - Shared utilities
- Align TypeScript paths and project references.

**Deliverable:** Monorepo builds with web + mobile apps.

## Phase 2 — Expo App Foundation
- Configure Expo Router layouts (`app/_layout.tsx`).
- Add providers (React Query, Zustand, theme).
- Configure env handling with `expo-constants`.
- Add `expo-dev-client` for native modules.

**Deliverable:** Mobile app boots with navigation and global providers.

## Phase 3 — Tailwind + Component System
- Install and configure `nativewind` with `global.css`.
- Add Tailwind config aligned with web tokens.
- Import core `react-native-reusables` components:
  - Button, Input, Card, Badge, Alert, Dialog, Sheet, Tabs.
- Create local component wrappers for app-specific defaults.

**Deliverable:** Stable RN component library using shadcn-style patterns.

## Phase 4 — Screen Migration
- Build a route parity map (web → mobile).
- Migrate priority screens first:
  - Auth (login/signup)
  - Primary dashboard
  - Key flows (core business actions)
- Add navigation structure (tabs + stacks).
- Add safe area and keyboard handling for forms.

**Deliverable:** Core screens functional on iOS/Android.

## Phase 5 — API + Auth Integration
- Generate OpenAPI client (`openapi-typescript` + hooks).
- Wire Supabase session handling with `expo-secure-store`.
- Implement auth flows:
  - Email/password or magic link
  - Session refresh
- Add API error handling and retry strategy.

**Deliverable:** Mobile app authenticates and fetches data safely.

## Phase 6 — Native UX Enhancements
- Haptics (`expo-haptics`).
- Toasts (`burnt` or `react-native-toast-message`).
- Bottom sheets (`@gorhom/bottom-sheet`).
- Charts (`victory-native` or `react-native-svg-charts`).

**Deliverable:** Mobile-native UX parity with key web features.

## Phase 7 — QA, Builds, Release
- Add mobile QA checklist (auth, deep links, offline).
- Configure `eas.json` build profiles.
- Internal release to TestFlight / Play Internal.
- Prepare store metadata, icons, and screenshots.

**Deliverable:** Mobile apps ready for staged rollout.

## Risks & Mitigations
- **Web-only components:** replace with RN equivalents early.
- **Design drift:** enforce shared tokens and component wrappers.
- **Auth edge cases:** test session refresh and offline states.
- **API latency:** ensure React Query caching + retries.

## Success Criteria
- Parity of core flows with web.
- Stable auth + data access.
- App passes internal QA across iOS/Android.
- EAS build + store submission pipeline working.
