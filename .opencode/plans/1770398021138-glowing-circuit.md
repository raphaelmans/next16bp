# Plan: Force top-of-page on Link navigation (Next.js 16)

## User goal
When navigating via `Link`, always start at the top of the destination page instead of preserving relative scroll.

## Research findings (Context7 + local Next docs)
- `Link` has a `scroll` prop that defaults to `true`, but default behavior can preserve scroll when the destination page is already visible in the viewport.
- `router.push()` and `router.replace()` support `{ scroll: false }` to disable Next.js scroll management.
- There is no `next.config` option to set a global Link scroll default.
- `data-scroll-behavior="smooth"` on `<html>` controls smooth-scroll override behavior in Next.js 16, not a global "always scroll to top" setting.

## Repo context
- No existing global route-change scroll manager was found.
- No current `scroll={...}` usage on `next/link`.
- No `router.push/replace` calls passing `scroll` options.
- Best global mount point for this behavior is `src/common/providers/index.tsx`.

## Recommended implementation
1. Add `src/common/providers/route-scroll-manager.tsx` as a client component.
2. In that component, observe `usePathname()` and `useSearchParams()` changes and call:
   - `window.scrollTo({ top: 0, left: 0, behavior: "auto" })` after route change.
   - Apply this to both pathname changes and query-only changes (confirmed: always top for Link navigations).
3. Add guards so forced top-scroll is skipped for:
   - hash anchors (`#section`) so in-page anchors still work,
   - browser back/forward (`popstate`) so native history restoration is preserved.
4. Mount `<RouteScrollManager />` once in `src/common/providers/index.tsx` next to other app-wide navigation behaviors.

## Verification
- Click normal internal `<Link>` from mid-page -> destination loads at top.
- Click query-only navigation on same pathname (example `?page=2`) -> scroll resets to top.
- Click hash-based navigation (`/docs#api`) -> anchor jump still works.
- Use browser back/forward -> prior scroll position restores.
- Confirm no regressions in navigation progress behavior.
- Run `pnpm lint`.
