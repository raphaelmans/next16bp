# Project Instructions

## Commands (pnpm)

Run all commands from repo root.

### Dev / Build

```bash
pnpm dev        # Start Next.js dev server
pnpm dev:grab   # Run opencode + next dev
pnpm build      # Production build, IMPORTANT: never run this unless instructed to. Use lint instead for validation.
pnpm start      # Start production server
```

### Lint / Format

```bash
pnpm lint       # biome check
pnpm format     # biome format --write
```

### Database (Drizzle + dotenvx)

```bash
pnpm db:pull         # Introspect DB schema (exception/recovery)
pnpm db:generate     # Generate SQL migrations from Drizzle schema
pnpm db:migrate      # Apply generated Drizzle migrations
pnpm db:push         # Direct schema sync (dev-only)
pnpm db:studio       # Open Drizzle Studio
pnpm db:seed:sports  # Seed sports
pnpm db:seed:buckets # Seed storage buckets
```

### Scripts (Normalization)

```bash
pnpm script:normalize-data
pnpm script:contract-test-normalize-data
pnpm script:test-all-tiers
pnpm script:promote-tier3
```

### Tests

- No test runner is configured. Use `pnpm lint` + `TZ=UTC pnpm build` for validation.
- If you add a test runner, update this file with the exact single-test command.

## Stack

- Next.js 16 App Router + React 19
- TypeScript (strict)
- tRPC + TanStack Query
- Drizzle ORM + Postgres (Supabase)
- Supabase (auth/storage)
- Stream Chat (GetStream) via `stream-chat` (reservation chat)
- Tailwind CSS + shadcn/ui
- Biome for lint/format

## Database Architecture Contract (Authoritative)

- Drizzle is the mandatory interface for application PostgreSQL data.
- Runtime app data access must use repository/service layers with `DbClient` (`src/lib/shared/infra/db/drizzle.ts`).
- Do not use Supabase data APIs (`from`, `rpc`, REST) for business-table CRUD/query paths.
- Drizzle schema files (`src/lib/shared/infra/db/schema/*`) and Drizzle migrations (`drizzle/*.sql`) are the schema source of truth.
- Preferred migration flow: `pnpm db:generate` then `pnpm db:migrate`.
- `pnpm db:push` is allowed only for local/dev prototyping; do not use as default shared/prod workflow.
- `pnpm db:pull` is introspection/recovery only, not the default schema-authoring path.
- Database scripts that touch app data should use Drizzle query builder or Drizzle-executed SQL; provider-specific scripts must be documented exceptions.
- Supabase usage scope: Auth and Storage platform services.
- For managed schemas (`auth`, `storage`), only reference stable PKs (for example `auth.users.id`); avoid new non-PK coupling.
- When a provider-specific exception is required, document rationale and a portability migration path.
- Detailed rationale and sources: `important/database/00-overview.md`, `important/database/99-official-sources.md`.

## Architecture Guides

This project uses architecture guides from `guides/`. They are maintained externally and copied via `copy-guides.sh`. Do not edit files inside `guides/` directly.

### Behavior Rules

- **No automatic refactoring.** If existing code does not follow a guide, note the deviation and continue. Do NOT refactor code outside the current task scope unless explicitly asked.
- **Core is mandatory for new and modified files.** Any file you create or modify must comply with the core standards listed below.
- **Framework guides are additive.** They layer on top of core; they do not replace it.
- **Ignore guides that do not apply to this project.** Do not import new libraries or suggest patterns from irrelevant guides.

### Mandatory - Client Core

Read and follow all of these for any client-side work:

- `guides/client/core/overview.md`
- `guides/client/core/architecture.md`
- `guides/client/core/conventions.md`
- `guides/client/core/folder-structure.md`
- `guides/client/core/client-api-architecture.md`
- `guides/client/core/domain-logic.md`
- `guides/client/core/error-handling.md`
- `guides/client/core/validation-zod.md`
- `guides/client/core/server-state-tanstack-query.md`
- `guides/client/core/query-keys.md`
- `guides/client/core/state-management.md`
- `guides/client/core/logging.md`
- `guides/client/core/testing.md`

### Mandatory - Server Core

Read and follow all of these for any server-side work:

- `guides/server/core/overview.md`
- `guides/server/core/conventions.md`
- `guides/server/core/api-contracts-zod-first.md`
- `guides/server/core/api-response.md`
- `guides/server/core/error-handling.md`
- `guides/server/core/endpoint-naming.md`
- `guides/server/core/id-generation.md`
- `guides/server/core/transaction.md`
- `guides/server/core/logging.md`
- `guides/server/core/rate-limiting.md`
- `guides/server/core/testing-service-layer.md`

### Framework Guides - React

- `guides/client/frameworks/reactjs/overview.md`
- `guides/client/frameworks/reactjs/conventions.md`
- `guides/client/frameworks/reactjs/composition-react.md`
- `guides/client/frameworks/reactjs/error-handling.md`
- `guides/client/frameworks/reactjs/server-state-patterns-react.md`
- `guides/client/frameworks/reactjs/forms-react-hook-form.md`
- `guides/client/frameworks/reactjs/state-zustand.md`
- `guides/client/frameworks/reactjs/ui-shadcn-radix.md`

### Framework Guides - Next.js Client

- `guides/client/frameworks/reactjs/metaframeworks/nextjs/overview.md`
- `guides/client/frameworks/reactjs/metaframeworks/nextjs/folder-structure.md`
- `guides/client/frameworks/reactjs/metaframeworks/nextjs/routing-ssr-params.md`
- `guides/client/frameworks/reactjs/metaframeworks/nextjs/environment.md`
- `guides/client/frameworks/reactjs/metaframeworks/nextjs/url-state-nuqs.md`
- `guides/client/frameworks/reactjs/metaframeworks/nextjs/trpc.md`
- `guides/client/frameworks/reactjs/metaframeworks/nextjs/ky-fetch.md`
- `guides/client/frameworks/reactjs/metaframeworks/nextjs/query-keys.md`

### Framework Guides - Next.js Server

- `guides/server/runtime/nodejs/metaframeworks/nextjs/route-handlers.md`
- `guides/server/runtime/nodejs/metaframeworks/nextjs/caching-revalidation.md`
- `guides/server/runtime/nodejs/metaframeworks/nextjs/next-config-security.md`
- `guides/server/runtime/nodejs/metaframeworks/nextjs/formdata-transport.md`
- `guides/server/runtime/nodejs/metaframeworks/nextjs/cron-routes.md`
- `guides/server/runtime/nodejs/metaframeworks/nextjs/metadata-seo.md`

### Framework Guides - tRPC

- `guides/server/runtime/nodejs/libraries/trpc/integration.md`
- `guides/server/runtime/nodejs/libraries/trpc/authentication.md`
- `guides/server/runtime/nodejs/libraries/trpc/rate-limiting.md`

### Framework Guides - Supabase

- `guides/server/runtime/nodejs/libraries/supabase/integration.md`
- `guides/server/runtime/nodejs/libraries/supabase/auth.md`

### Framework Guides - OpenAPI

- `guides/server/core/zod-openapi-generation.md`
- `guides/server/runtime/nodejs/libraries/openapi/parity-testing.md`

### Feature Guides - Async Jobs

- `guides/server/core/async-jobs-outbox.md`

## Architecture (current + target)

- Routes: `src/app`
- Frontend features: `src/features`
- Shared UI: `src/components`
- Server (current): `src/lib/shared` and `src/lib/modules`
- Shared helpers: `src/common`
- Target: server-only infra under `src/lib` (no client/browser imports), except runtime-safe pure shared files under `src/lib/modules/*/shared`
- tRPC client: `src/trpc`

## Conventions

- Formatting: Biome, 2-space indent, double quotes, semicolons; keep changes minimal.
- Imports: use `@/` alias; group external → internal alias → relative.
- Frontend: add "use client" to client components; StandardForm in `src/components/form`; URL state via `nuqs`; `trpc` from `@/trpc/client`; invalidate via `trpc.useUtils()`; pure feature logic in `src/features/<feature>/(domain.ts|helpers.ts)`.
- Domain/helper convention: keep deterministic, side-effect-free transforms in `domain.ts`/`helpers.ts`; for cross-runtime reuse use `src/lib/modules/<module>/shared/(domain.ts|transform.ts|helpers.ts)`; avoid React components/hooks, DB/auth/network calls, and `process.env` in these files.
- IMPORTANT: Component placement: `src/app/**` is routes only (e.g. `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `route.ts`). Do not add new component modules under `src/app/**` (existing route-local components are legacy); put feature UI in `src/features/<feature>/components`, shared UI in `src/components`, shared helpers in `src/common` (see `@guides/client/core/folder-structure.md`).
- Backend: repository/service/use-case/router layering; repositories return `null`; services own transactions; routers validate input; log business events as `<entity>.<past_tense_action>`.
- Time zones: treat `place.timeZone` as canonical; use `src/common/time-zone.ts` and `src/common/format.ts`.

## Environment

- Copy `.env.example` to `.env.local`; DB scripts expect `dotenvx`.
- Required: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.


## Agent Rules

- When instructions reference files via `@path`, load them with the Read tool.
- When using `ui-ux-pro-max`, read `@business-contexts/kudoscourts-design-system.md` first and follow its palette/typography.

<!-- NEXT-AGENTS-MD-START -->[Next.js Docs Index]|root: ./.next-docs|STOP. What you remember about Next.js is WRONG for this project. Always search docs and read before any task.|If docs missing, run this command first: npx @next/codemod agents-md --output CLAUDE.md|01-app/01-getting-started:{01-installation.mdx,02-project-structure.mdx,03-layouts-and-pages.mdx,04-linking-and-navigating.mdx,05-server-and-client-components.mdx,06-cache-components.mdx,07-fetching-data.mdx,08-updating-data.mdx,09-caching-and-revalidating.mdx,10-error-handling.mdx,11-css.mdx,12-images.mdx,13-fonts.mdx,14-metadata-and-og-images.mdx,15-route-handlers.mdx,16-proxy.mdx,17-deploying.mdx,18-upgrading.mdx}|01-app/02-guides:{analytics.mdx,authentication.mdx,backend-for-frontend.mdx,caching.mdx,ci-build-caching.mdx,content-security-policy.mdx,css-in-js.mdx,custom-server.mdx,data-security.mdx,debugging.mdx,draft-mode.mdx,environment-variables.mdx,forms.mdx,incremental-static-regeneration.mdx,instrumentation.mdx,internationalization.mdx,json-ld.mdx,lazy-loading.mdx,local-development.mdx,mcp.mdx,mdx.mdx,memory-usage.mdx,multi-tenant.mdx,multi-zones.mdx,open-telemetry.mdx,package-bundling.mdx,prefetching.mdx,production-checklist.mdx,progressive-web-apps.mdx,redirecting.mdx,sass.mdx,scripts.mdx,self-hosting.mdx,single-page-applications.mdx,static-exports.mdx,tailwind-v3-css.mdx,third-party-libraries.mdx,videos.mdx}|01-app/02-guides/migrating:{app-router-migration.mdx,from-create-react-app.mdx,from-vite.mdx}|01-app/02-guides/testing:{cypress.mdx,jest.mdx,playwright.mdx,vitest.mdx}|01-app/02-guides/upgrading:{codemods.mdx,version-14.mdx,version-15.mdx,version-16.mdx}|01-app/03-api-reference:{07-edge.mdx,08-turbopack.mdx}|01-app/03-api-reference/01-directives:{use-cache-private.mdx,use-cache-remote.mdx,use-cache.mdx,use-client.mdx,use-server.mdx}|01-app/03-api-reference/02-components:{font.mdx,form.mdx,image.mdx,link.mdx,script.mdx}|01-app/03-api-reference/03-file-conventions/01-metadata:{app-icons.mdx,manifest.mdx,opengraph-image.mdx,robots.mdx,sitemap.mdx}|01-app/03-api-reference/03-file-conventions:{default.mdx,dynamic-routes.mdx,error.mdx,forbidden.mdx,instrumentation-client.mdx,instrumentation.mdx,intercepting-routes.mdx,layout.mdx,loading.mdx,mdx-components.mdx,not-found.mdx,page.mdx,parallel-routes.mdx,proxy.mdx,public-folder.mdx,route-groups.mdx,route-segment-config.mdx,route.mdx,src-folder.mdx,template.mdx,unauthorized.mdx}|01-app/03-api-reference/04-functions:{after.mdx,cacheLife.mdx,cacheTag.mdx,connection.mdx,cookies.mdx,draft-mode.mdx,fetch.mdx,forbidden.mdx,generate-image-metadata.mdx,generate-metadata.mdx,generate-sitemaps.mdx,generate-static-params.mdx,generate-viewport.mdx,headers.mdx,image-response.mdx,next-request.mdx,next-response.mdx,not-found.mdx,permanentRedirect.mdx,redirect.mdx,refresh.mdx,revalidatePath.mdx,revalidateTag.mdx,unauthorized.mdx,unstable_cache.mdx,unstable_noStore.mdx,unstable_rethrow.mdx,updateTag.mdx,use-link-status.mdx,use-params.mdx,use-pathname.mdx,use-report-web-vitals.mdx,use-router.mdx,use-search-params.mdx,use-selected-layout-segment.mdx,use-selected-layout-segments.mdx,userAgent.mdx}|01-app/03-api-reference/05-config/01-next-config-js:{adapterPath.mdx,allowedDevOrigins.mdx,appDir.mdx,assetPrefix.mdx,authInterrupts.mdx,basePath.mdx,browserDebugInfoInTerminal.mdx,cacheComponents.mdx,cacheHandlers.mdx,cacheLife.mdx,compress.mdx,crossOrigin.mdx,cssChunking.mdx,devIndicators.mdx,distDir.mdx,env.mdx,expireTime.mdx,exportPathMap.mdx,generateBuildId.mdx,generateEtags.mdx,headers.mdx,htmlLimitedBots.mdx,httpAgentOptions.mdx,images.mdx,incrementalCacheHandlerPath.mdx,inlineCss.mdx,isolatedDevBuild.mdx,logging.mdx,mdxRs.mdx,onDemandEntries.mdx,optimizePackageImports.mdx,output.mdx,pageExtensions.mdx,poweredByHeader.mdx,productionBrowserSourceMaps.mdx,proxyClientMaxBodySize.mdx,reactCompiler.mdx,reactMaxHeadersLength.mdx,reactStrictMode.mdx,redirects.mdx,rewrites.mdx,sassOptions.mdx,serverActions.mdx,serverComponentsHmrCache.mdx,serverExternalPackages.mdx,staleTimes.mdx,staticGeneration.mdx,taint.mdx,trailingSlash.mdx,transpilePackages.mdx,turbopack.mdx,turbopackFileSystemCache.mdx,typedRoutes.mdx,typescript.mdx,urlImports.mdx,useLightningcss.mdx,viewTransition.mdx,webVitalsAttribution.mdx,webpack.mdx}|01-app/03-api-reference/05-config:{02-typescript.mdx,03-eslint.mdx}|01-app/03-api-reference/06-cli:{create-next-app.mdx,next.mdx}|02-pages/01-getting-started:{01-installation.mdx,02-project-structure.mdx,04-images.mdx,05-fonts.mdx,06-css.mdx,11-deploying.mdx}|02-pages/02-guides:{analytics.mdx,authentication.mdx,babel.mdx,ci-build-caching.mdx,content-security-policy.mdx,css-in-js.mdx,custom-server.mdx,debugging.mdx,draft-mode.mdx,environment-variables.mdx,forms.mdx,incremental-static-regeneration.mdx,instrumentation.mdx,internationalization.mdx,lazy-loading.mdx,mdx.mdx,multi-zones.mdx,open-telemetry.mdx,package-bundling.mdx,post-css.mdx,preview-mode.mdx,production-checklist.mdx,redirecting.mdx,sass.mdx,scripts.mdx,self-hosting.mdx,static-exports.mdx,tailwind-v3-css.mdx,third-party-libraries.mdx}|02-pages/02-guides/migrating:{app-router-migration.mdx,from-create-react-app.mdx,from-vite.mdx}|02-pages/02-guides/testing:{cypress.mdx,jest.mdx,playwright.mdx,vitest.mdx}|02-pages/02-guides/upgrading:{codemods.mdx,version-10.mdx,version-11.mdx,version-12.mdx,version-13.mdx,version-14.mdx,version-9.mdx}|02-pages/03-building-your-application/01-routing:{01-pages-and-layouts.mdx,02-dynamic-routes.mdx,03-linking-and-navigating.mdx,05-custom-app.mdx,06-custom-document.mdx,07-api-routes.mdx,08-custom-error.mdx}|02-pages/03-building-your-application/02-rendering:{01-server-side-rendering.mdx,02-static-site-generation.mdx,04-automatic-static-optimization.mdx,05-client-side-rendering.mdx}|02-pages/03-building-your-application/03-data-fetching:{01-get-static-props.mdx,02-get-static-paths.mdx,03-forms-and-mutations.mdx,03-get-server-side-props.mdx,05-client-side.mdx}|02-pages/03-building-your-application/06-configuring:{12-error-handling.mdx}|02-pages/04-api-reference:{06-edge.mdx,08-turbopack.mdx}|02-pages/04-api-reference/01-components:{font.mdx,form.mdx,head.mdx,image-legacy.mdx,image.mdx,link.mdx,script.mdx}|02-pages/04-api-reference/02-file-conventions:{instrumentation.mdx,proxy.mdx,public-folder.mdx,src-folder.mdx}|02-pages/04-api-reference/03-functions:{get-initial-props.mdx,get-server-side-props.mdx,get-static-paths.mdx,get-static-props.mdx,next-request.mdx,next-response.mdx,use-report-web-vitals.mdx,use-router.mdx,userAgent.mdx}|02-pages/04-api-reference/04-config/01-next-config-js:{adapterPath.mdx,allowedDevOrigins.mdx,assetPrefix.mdx,basePath.mdx,bundlePagesRouterDependencies.mdx,compress.mdx,crossOrigin.mdx,devIndicators.mdx,distDir.mdx,env.mdx,exportPathMap.mdx,generateBuildId.mdx,generateEtags.mdx,headers.mdx,httpAgentOptions.mdx,images.mdx,isolatedDevBuild.mdx,onDemandEntries.mdx,optimizePackageImports.mdx,output.mdx,pageExtensions.mdx,poweredByHeader.mdx,productionBrowserSourceMaps.mdx,proxyClientMaxBodySize.mdx,reactStrictMode.mdx,redirects.mdx,rewrites.mdx,serverExternalPackages.mdx,trailingSlash.mdx,transpilePackages.mdx,turbopack.mdx,typescript.mdx,urlImports.mdx,useLightningcss.mdx,webVitalsAttribution.mdx,webpack.mdx}|02-pages/04-api-reference/04-config:{01-typescript.mdx,02-eslint.mdx}|02-pages/04-api-reference/05-cli:{create-next-app.mdx,next.mdx}|03-architecture:{accessibility.mdx,fast-refresh.mdx,nextjs-compiler.mdx,supported-browsers.mdx}|04-community:{01-contribution-guide.mdx,02-rspack.mdx}<!-- NEXT-AGENTS-MD-END -->
