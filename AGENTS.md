# AGENTS

## Purpose
Guidance for agentic coding in this repo: commands, style, and conventions.

## Stack Overview
- Next.js 16 App Router + React 19
- TypeScript (strict)
- tRPC + TanStack Query
- Drizzle ORM + Postgres
- Supabase (auth/storage)
- Biome for lint/format
- Tailwind CSS + shadcn/ui patterns

## Commands (pnpm)
Run all commands from repo root.

### Dev / Build
```bash
pnpm dev        # Runs opencode + next dev
pnpm build      # Next.js production build
pnpm start      # Start production server
```

### Lint / Format
```bash
pnpm lint       # biome check
pnpm format     # biome format --write
```

### Database (Drizzle + dotenvx)
```bash
pnpm db:pull       # pull schema from DB
pnpm db:generate   # generate migrations
pnpm db:migrate    # run migrations
pnpm db:push       # push schema to DB
pnpm db:studio     # open drizzle studio
pnpm db:seed       # seed courts
pnpm db:seed:buckets # seed storage buckets
```

### Tests
- No test runner is configured in `package.json` and there are no `*.test.*` / `*.spec.*` files in `src/`.
- If you add a test runner, update this file with the exact single-test command.
- Until then, prefer `pnpm lint` + `pnpm build` for validation.

## Cursor / Copilot Rules
- No `.cursor/rules/`, `.cursorrules`, or `.github/copilot-instructions.md` found.

## External Instructions (opencode rules)
- When instructions reference files via `@path`, load them with the Read tool only when needed and treat them as mandatory.
- When using the `ui-ux-pro-max` skill, always read `@business-contexts/kudoscourts-design-system.md` before UI changes.
- Use its color palette + typography as the design foundation; extend without overriding core tokens.

## Formatting & Linting
- Biome is the source of truth (`biome.json`).
- 2-space indentation, double quotes, semicolons.
- Let Biome organize imports (`organizeImports` is on).
- Keep changes minimal and avoid reformatting unrelated files.

## Imports
- Use `@/` path alias for `src/` imports (`@/*` → `src/*`).
- Prefer absolute alias imports over long relative paths.
- Group imports by: external → internal alias → relative.

## TypeScript
- `strict: true` is enabled in `tsconfig.json`.
- Avoid `any`; prefer `unknown` with narrowing.
- Export types from Zod schemas (`z.infer` pattern).
- Keep types close to usage and re-use shared DTOs.

## File & Naming Conventions
- File names: kebab-case (`payment-proof.service.ts`).
- React components: PascalCase.
- Hooks: `useX` prefix.
- Types/interfaces: PascalCase.
- Feature helpers: prefer `src/features/<feature>/helpers.ts` (single file exporting multiple helpers).
- Error classes: `<Entity><ErrorType>Error`.
- Error codes: `<MODULE>_<ERROR_TYPE>` in SCREAMING_SNAKE_CASE.

## Frontend Conventions
- App Router lives in `src/app`; add "use client" at the top of client components/hooks.
- Prefer `date-fns` for date formatting (no native `Date` formatting).
- Use `react-hook-form` + `@hookform/resolvers` + Zod for forms.
- Prefer StandardForm components in `src/components/form` (StandardFormProvider, StandardFormInput/Select/Checkbox/Field).
- Destructure `formState` values and helpers like `setValue`/`reset` from the form; avoid `form.formState.*` in inline expressions and `form.setValue(...)`.
- Form submissions: use `mutateAsync`, show server errors via toast only, reset on success.
- Async form defaults (especially selects with async options): initialize with empty `defaultValues`, `reset` once both record data + options are ready, and render a loading state/skeleton until the reset is applied to avoid first-render placeholders.
- Prefer shared formatting helpers in `src/shared/lib/format.ts`.
- Query params: use `nuqs` (`useQueryState` / `useQueryStates`) and avoid manual `router.replace` or `useSearchParams` reconciliation.
- Cache invalidation: use `trpc.useUtils()` for tRPC data; for non-tRPC caches, use Query Key Factory (`@lukemorales/query-key-factory`) keys + `useQueryClient()`.

### Client Logic Extraction
- Keep non-trivial transforms out of TSX.
- Prefer `src/features/<feature>/helpers.ts` for pure-ish functions (filter/sort/group/count, status mapping, option builders, DTO shaping).
- Hooks can call helpers and return UI-ready data; TSX should mostly render and wire events.
- `helpers.ts` may import from `src/shared/lib/*`; promote helpers to `src/shared/lib/*` when cross-feature.

## tRPC (React Query Hooks)
- Client: import `trpc` from `@/trpc/client` (created via `createTRPCReact<AppRouter>()`).
- Queries: `trpc.<router>.<procedure>.useQuery(input?, opts?)`.
- Mutations: `trpc.<router>.<procedure>.useMutation({ onSuccess, onError })`, then call `mutate` / `mutateAsync`.
- Parallel queries: `trpc.useQueries((t) => [t.foo.bar(input), ...])`.
- Cache helpers: `const utils = trpc.useUtils()` then `utils.<router>.<procedure>.invalidate(input?)` or `utils.<router>.invalidate()`.
- Avoid legacy APIs: `useTRPC`, `useTRPCClient`, `queryOptions`, `mutationOptions`, and manual tRPC query keys.

## Non-tRPC HTTP (Ky + Query Keys)
- Shared clients live in `src/shared/lib/clients/<client>/` (e.g., `google-loc-client/`).
- Query keys: use `@lukemorales/query-key-factory` in `query-keys.ts` (avoid ad-hoc array keys).
- HTTP: use `ky` and parse `ApiResponse<T>` / `ApiErrorResponse` from `src/shared/kernel/response.ts` (add if missing).
- Errors: throw a typed `ApiClientError` (`code`, `requestId`, `httpStatus`, `details?`) so TanStack Query can surface structured failures.

## Time Zones (Place-Canonical)
- Production runtimes often run in UTC; always treat `place.timeZone` (IANA) as canonical for booking/availability/pricing.
- Avoid “day math” via `new Date(y, m, d).toISOString()` or `.toISOString().split("T")[0]` (timezone-dependent).
- Use shared helpers:
  - `src/shared/lib/time-zone.ts` for place-local day bounds + weekday/minute-of-day calculations.
  - `src/shared/lib/format.ts` for place-local display (`formatInTimeZone`, `formatTimeInTimeZone`, `formatTimeRangeInTimeZone`).
- UI date picking: pass `timeZone` through to `KudosDatePicker`/`Calendar` so the calendar day is interpreted in the place timezone.
- Validation: run `TZ=UTC pnpm build` (in addition to `pnpm lint`) to catch timezone regressions.


## Backend Architecture (Modules)
`src/modules/<module>/` generally uses this layering:
- `errors/` - domain error classes
- `repositories/` - DB-only access
- `services/` - domain logic + transactions
- `use-cases/` - multi-service orchestration
- `dtos/` - Zod schemas + DTO types
- `<module>.router.ts` - tRPC endpoints
- `factories/` - module factory/wiring

### Repository Rules
- Accept `ctx?: RequestContext`.
- Return `null` for not found.
- No business logic or logging.

### Service Rules
- Accept repository interfaces and `TransactionManager`.
- Pass `ctx` through for reads.
- For writes: use existing `ctx.tx` or open a transaction.
- Log business events using `logger.info({ event: "<entity>.<action>", ... })`.

### Use Case Rules
- Only for multi-service orchestration or side effects.
- Throw domain errors, not generic `Error`.
- External calls outside transactions; side effects after commit.

### Router Rules
- Use `publicProcedure` / `protectedProcedure`.
- Validate input with Zod `.input()`.
- Map `null` returns to domain errors.
- No direct business logic or logging.

## Error Handling
- Base errors live in `src/shared/kernel/errors.ts`.
- All domain errors extend the appropriate base error.
- Error messages must be user-safe and include details in `details`.
- No catching and re-throwing in routers; let formatter handle it.
- tRPC error formatter includes `requestId` and logs:
  - `AppError` → `warn`
  - Unknown errors → `error`

## Logging
- Use structured logging via Pino (see `guides/server/core/logging.md`).
- Business events: `<entity>.<past_tense_action>` (e.g., `user.created`).
- Log request lifecycle (`Request started` / `Request completed`) and include `requestId` in error logs.
- Avoid verbose log messages; keep them short and consistent.

## Validation & DTOs
- Zod schemas for all inputs (`dtos/`).
- Export DTO types via `z.infer` and omit sensitive fields in outputs.

## Data Formatting
- Use helpers in `src/shared/lib/format.ts` and prefer `date-fns` utilities over manual date math.

## Environment & Secrets
- DB scripts expect `.env.local` via `dotenvx`; never commit secrets, service role keys, or `.env.*` files.

## Docs & References
- Server conventions: `guides/server/core/conventions.md`.
- Error handling: `guides/server/core/error-handling.md`.
- Logging: `guides/server/core/logging.md`.
- Date handling: `guides/client/references/12-date-handling.md`.
- Non-tRPC route handlers: `guides/server/nextjs/route-handlers.md`.
- Non-tRPC ky client: `guides/client/nextjs/ky-fetch.md`.
- Non-tRPC query keys: `guides/client/nextjs/query-keys.md`.

## Update This File When
- A test runner is added.
- Lint/format tools or scripts change.
- Architecture rules evolve.

<!-- NEXT-AGENTS-MD-START -->[Next.js Docs Index]|root: ./.next-docs|STOP. What you remember about Next.js is WRONG for this project. Always search docs and read before any task.|If docs missing, run this command first: npx @next/codemod agents-md --output AGENTS.md|01-app/01-getting-started:{01-installation.mdx,02-project-structure.mdx,03-layouts-and-pages.mdx,04-linking-and-navigating.mdx,05-server-and-client-components.mdx,06-cache-components.mdx,07-fetching-data.mdx,08-updating-data.mdx,09-caching-and-revalidating.mdx,10-error-handling.mdx,11-css.mdx,12-images.mdx,13-fonts.mdx,14-metadata-and-og-images.mdx,15-route-handlers.mdx,16-proxy.mdx,17-deploying.mdx,18-upgrading.mdx}|01-app/02-guides:{analytics.mdx,authentication.mdx,backend-for-frontend.mdx,caching.mdx,ci-build-caching.mdx,content-security-policy.mdx,css-in-js.mdx,custom-server.mdx,data-security.mdx,debugging.mdx,draft-mode.mdx,environment-variables.mdx,forms.mdx,incremental-static-regeneration.mdx,instrumentation.mdx,internationalization.mdx,json-ld.mdx,lazy-loading.mdx,local-development.mdx,mcp.mdx,mdx.mdx,memory-usage.mdx,multi-tenant.mdx,multi-zones.mdx,open-telemetry.mdx,package-bundling.mdx,prefetching.mdx,production-checklist.mdx,progressive-web-apps.mdx,redirecting.mdx,sass.mdx,scripts.mdx,self-hosting.mdx,single-page-applications.mdx,static-exports.mdx,tailwind-v3-css.mdx,third-party-libraries.mdx,videos.mdx}|01-app/02-guides/migrating:{app-router-migration.mdx,from-create-react-app.mdx,from-vite.mdx}|01-app/02-guides/testing:{cypress.mdx,jest.mdx,playwright.mdx,vitest.mdx}|01-app/02-guides/upgrading:{codemods.mdx,version-14.mdx,version-15.mdx,version-16.mdx}|01-app/03-api-reference:{07-edge.mdx,08-turbopack.mdx}|01-app/03-api-reference/01-directives:{use-cache-private.mdx,use-cache-remote.mdx,use-cache.mdx,use-client.mdx,use-server.mdx}|01-app/03-api-reference/02-components:{font.mdx,form.mdx,image.mdx,link.mdx,script.mdx}|01-app/03-api-reference/03-file-conventions/01-metadata:{app-icons.mdx,manifest.mdx,opengraph-image.mdx,robots.mdx,sitemap.mdx}|01-app/03-api-reference/03-file-conventions:{default.mdx,dynamic-routes.mdx,error.mdx,forbidden.mdx,instrumentation-client.mdx,instrumentation.mdx,intercepting-routes.mdx,layout.mdx,loading.mdx,mdx-components.mdx,not-found.mdx,page.mdx,parallel-routes.mdx,proxy.mdx,public-folder.mdx,route-groups.mdx,route-segment-config.mdx,route.mdx,src-folder.mdx,template.mdx,unauthorized.mdx}|01-app/03-api-reference/04-functions:{after.mdx,cacheLife.mdx,cacheTag.mdx,connection.mdx,cookies.mdx,draft-mode.mdx,fetch.mdx,forbidden.mdx,generate-image-metadata.mdx,generate-metadata.mdx,generate-sitemaps.mdx,generate-static-params.mdx,generate-viewport.mdx,headers.mdx,image-response.mdx,next-request.mdx,next-response.mdx,not-found.mdx,permanentRedirect.mdx,redirect.mdx,refresh.mdx,revalidatePath.mdx,revalidateTag.mdx,unauthorized.mdx,unstable_cache.mdx,unstable_noStore.mdx,unstable_rethrow.mdx,updateTag.mdx,use-link-status.mdx,use-params.mdx,use-pathname.mdx,use-report-web-vitals.mdx,use-router.mdx,use-search-params.mdx,use-selected-layout-segment.mdx,use-selected-layout-segments.mdx,userAgent.mdx}|01-app/03-api-reference/05-config/01-next-config-js:{adapterPath.mdx,allowedDevOrigins.mdx,appDir.mdx,assetPrefix.mdx,authInterrupts.mdx,basePath.mdx,browserDebugInfoInTerminal.mdx,cacheComponents.mdx,cacheHandlers.mdx,cacheLife.mdx,compress.mdx,crossOrigin.mdx,cssChunking.mdx,devIndicators.mdx,distDir.mdx,env.mdx,expireTime.mdx,exportPathMap.mdx,generateBuildId.mdx,generateEtags.mdx,headers.mdx,htmlLimitedBots.mdx,httpAgentOptions.mdx,images.mdx,incrementalCacheHandlerPath.mdx,inlineCss.mdx,isolatedDevBuild.mdx,logging.mdx,mdxRs.mdx,onDemandEntries.mdx,optimizePackageImports.mdx,output.mdx,pageExtensions.mdx,poweredByHeader.mdx,productionBrowserSourceMaps.mdx,proxyClientMaxBodySize.mdx,reactCompiler.mdx,reactMaxHeadersLength.mdx,reactStrictMode.mdx,redirects.mdx,rewrites.mdx,sassOptions.mdx,serverActions.mdx,serverComponentsHmrCache.mdx,serverExternalPackages.mdx,staleTimes.mdx,staticGeneration.mdx,taint.mdx,trailingSlash.mdx,transpilePackages.mdx,turbopack.mdx,turbopackFileSystemCache.mdx,typedRoutes.mdx,typescript.mdx,urlImports.mdx,useLightningcss.mdx,viewTransition.mdx,webVitalsAttribution.mdx,webpack.mdx}|01-app/03-api-reference/05-config:{02-typescript.mdx,03-eslint.mdx}|01-app/03-api-reference/06-cli:{create-next-app.mdx,next.mdx}|02-pages/01-getting-started:{01-installation.mdx,02-project-structure.mdx,04-images.mdx,05-fonts.mdx,06-css.mdx,11-deploying.mdx}|02-pages/02-guides:{analytics.mdx,authentication.mdx,babel.mdx,ci-build-caching.mdx,content-security-policy.mdx,css-in-js.mdx,custom-server.mdx,debugging.mdx,draft-mode.mdx,environment-variables.mdx,forms.mdx,incremental-static-regeneration.mdx,instrumentation.mdx,internationalization.mdx,lazy-loading.mdx,mdx.mdx,multi-zones.mdx,open-telemetry.mdx,package-bundling.mdx,post-css.mdx,preview-mode.mdx,production-checklist.mdx,redirecting.mdx,sass.mdx,scripts.mdx,self-hosting.mdx,static-exports.mdx,tailwind-v3-css.mdx,third-party-libraries.mdx}|02-pages/02-guides/migrating:{app-router-migration.mdx,from-create-react-app.mdx,from-vite.mdx}|02-pages/02-guides/testing:{cypress.mdx,jest.mdx,playwright.mdx,vitest.mdx}|02-pages/02-guides/upgrading:{codemods.mdx,version-10.mdx,version-11.mdx,version-12.mdx,version-13.mdx,version-14.mdx,version-9.mdx}|02-pages/03-building-your-application/01-routing:{01-pages-and-layouts.mdx,02-dynamic-routes.mdx,03-linking-and-navigating.mdx,05-custom-app.mdx,06-custom-document.mdx,07-api-routes.mdx,08-custom-error.mdx}|02-pages/03-building-your-application/02-rendering:{01-server-side-rendering.mdx,02-static-site-generation.mdx,04-automatic-static-optimization.mdx,05-client-side-rendering.mdx}|02-pages/03-building-your-application/03-data-fetching:{01-get-static-props.mdx,02-get-static-paths.mdx,03-forms-and-mutations.mdx,03-get-server-side-props.mdx,05-client-side.mdx}|02-pages/03-building-your-application/06-configuring:{12-error-handling.mdx}|02-pages/04-api-reference:{06-edge.mdx,08-turbopack.mdx}|02-pages/04-api-reference/01-components:{font.mdx,form.mdx,head.mdx,image-legacy.mdx,image.mdx,link.mdx,script.mdx}|02-pages/04-api-reference/02-file-conventions:{instrumentation.mdx,proxy.mdx,public-folder.mdx,src-folder.mdx}|02-pages/04-api-reference/03-functions:{get-initial-props.mdx,get-server-side-props.mdx,get-static-paths.mdx,get-static-props.mdx,next-request.mdx,next-response.mdx,use-report-web-vitals.mdx,use-router.mdx,userAgent.mdx}|02-pages/04-api-reference/04-config/01-next-config-js:{adapterPath.mdx,allowedDevOrigins.mdx,assetPrefix.mdx,basePath.mdx,bundlePagesRouterDependencies.mdx,compress.mdx,crossOrigin.mdx,devIndicators.mdx,distDir.mdx,env.mdx,exportPathMap.mdx,generateBuildId.mdx,generateEtags.mdx,headers.mdx,httpAgentOptions.mdx,images.mdx,isolatedDevBuild.mdx,onDemandEntries.mdx,optimizePackageImports.mdx,output.mdx,pageExtensions.mdx,poweredByHeader.mdx,productionBrowserSourceMaps.mdx,proxyClientMaxBodySize.mdx,reactStrictMode.mdx,redirects.mdx,rewrites.mdx,serverExternalPackages.mdx,trailingSlash.mdx,transpilePackages.mdx,turbopack.mdx,typescript.mdx,urlImports.mdx,useLightningcss.mdx,webVitalsAttribution.mdx,webpack.mdx}|02-pages/04-api-reference/04-config:{01-typescript.mdx,02-eslint.mdx}|02-pages/04-api-reference/05-cli:{create-next-app.mdx,next.mdx}|03-architecture:{accessibility.mdx,fast-refresh.mdx,nextjs-compiler.mdx,supported-browsers.mdx}|04-community:{01-contribution-guide.mdx,02-rspack.mdx}<!-- NEXT-AGENTS-MD-END -->
