# Project Instructions

## Commands (pnpm)

Run all commands from repo root.

### Dev / Build

```bash
pnpm dev        # Start Next.js dev server
pnpm dev:grab   # Run opencode + next dev
pnpm build      # Production build. Do not run unless explicitly instructed.
pnpm start      # Start production server
```

### Lint / Format

```bash
pnpm lint       # biome check
pnpm format     # biome format --write
```

### Database (Drizzle + dotenvx)

```bash
pnpm db:pull         # Pull schema from DB
pnpm db:generate     # Generate migrations
pnpm db:migrate      # Run migrations
pnpm db:push         # Push schema (dev only)
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

## Validation Policy

- Default gate for this frontend migration: `pnpm lint` + manual smoke matrix.
- Do not run `pnpm build` unless explicitly requested by the user.
- If a test runner is introduced later, update this file with the exact single-test command.

## Stack

- Next.js 16 App Router + React 19
- TypeScript (strict)
- tRPC + TanStack Query
- Drizzle ORM + Postgres (Supabase)
- Supabase (auth/storage)
- Stream Chat (GetStream) via `stream-chat` (reservation chat)
- Tailwind CSS + shadcn/ui
- Biome for lint/format

## Frontend Architecture Contract (Authoritative)

### Core Paths

- Routes: `src/app`
- Frontend features: `src/features`
- Shared UI: `src/components`
- Shared client-safe helpers/contracts: `src/common`
- Server-only code: `src/lib`
- tRPC client wiring: `src/trpc`

### Non-Negotiable Boundaries

- `src/app/**` is route boundary only for new code: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `route.ts`, metadata files.
- Do not add new route-local component modules under `src/app/**`.
- Put feature UI in `src/features/<feature>/components`.
- Put shared UI in `src/components`.
- Put shared client-safe logic in `src/common`.
- Keep server-only code under `src/lib` and avoid browser/client imports there.

### Canonical Client Data Chain

Use this chain for migrated code:

`components -> query adapter hooks -> featureApi -> tRPC transport`

Rules:

- No direct `trpc.*.useQuery/useMutation` usage in pages or presentation components after migration.
- Transport and cache behavior must be centralized in feature query adapters/hooks.
- Components should orchestrate UI state only.

## tRPC-Retained Conventions

- Import `trpc` only from `@/trpc/client`.
- Use `trpc.useUtils()` for invalidation utilities.
- Transitional compatibility mode is allowed only inside feature hooks during migration.
- Keep tRPC as the transport foundation; do not redesign backend routers in this phase.

## Hook and API Naming Standards

### Hook Naming

- Query hooks: `useQuery<Feature><Noun><Qualifier?>`
- Mutation hooks: `useMut<Feature><Verb><Object?>`
- Composed hooks: `useMod<DescriptiveName>`

### Feature API Contract

For each feature, standardize on:

- `I<Feature>Api` (interface)
- `<Feature>Api` (class implementing interface)
- `create<Feature>Api` (factory)
- `<Feature>ApiDeps` (dependency type; includes tRPC/client deps + error normalizer)

## Next.js 16 Route Boundary Rules

- Parse and validate `params` / `searchParams` at page/layout boundary.
- Keep route parsing and auth/layout composition in `src/app`.
- Pass typed values into feature modules; do not couple features to route segment shape.
- Server Components are default; add `"use client"` only where interaction/browser APIs are required.
- Keep client boundaries as small as possible to reduce bundle size.

## Migration Policy (Frontend Overhaul)

- Rollout strategy: big-bang cutover (single release).
- Delivery style: internal implementation waves on one integration branch.
- UX policy: strict behavior parity; no intentional redesign in this migration.
- Validation gate: `pnpm lint` + manual parity matrix.
- Release blocker: unresolved P0/P1 parity regressions.

## Existing Backend Conventions (Unchanged)

- Backend layering: repository/service/use-case/router.
- Repositories return `null` when not found.
- Services own transactions.
- Routers validate input.
- Business event naming: `<entity>.<past_tense_action>`.

## Time Zone Rules

- Treat `place.timeZone` as canonical.
- Use `src/common/time-zone.ts` and `src/common/format.ts`.

## Environment

- Copy `.env.example` to `.env.local`; DB scripts expect `dotenvx`.
- Required: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

## Canonical External References (Absolute Paths)

Use these as architecture source-of-truth for this migration:

- `/Users/raphaelm/Documents/Coding/node-architecture/client/core/*.md`
- `/Users/raphaelm/Documents/Coding/node-architecture/client/frameworks/reactjs/metaframeworks/nextjs/*.md`
- `/Users/raphaelm/Documents/Coding/node-architecture/OPENCODE-INTEGRATION.md`
- `/Users/raphaelm/Documents/Coding/node-architecture/README.md`

## Agent Rules

- When instructions reference files via `@path`, load them with the Read tool.
- Do not preload all referenced files; load only what is relevant to the current task.
- After completing a complex implementation (multi-file changes, new features, architectural changes, or any non-trivial work), ask: "Should I run `/agent-context` to log this work?"
- Do not run `/agent-context` automatically.

<!-- NEXT-AGENTS-MD-START -->[Next.js Docs Index]|root: ./.next-docs|STOP. What you remember about Next.js is WRONG for this project. Always search docs and read before any task.|If docs missing, run this command first: npx @next/codemod agents-md --output AGENTS.md|01-app/01-getting-started:{01-installation.mdx,02-project-structure.mdx,03-layouts-and-pages.mdx,04-linking-and-navigating.mdx,05-server-and-client-components.mdx,06-cache-components.mdx,07-fetching-data.mdx,08-updating-data.mdx,09-caching-and-revalidating.mdx,10-error-handling.mdx,11-css.mdx,12-images.mdx,13-fonts.mdx,14-metadata-and-og-images.mdx,15-route-handlers.mdx,16-proxy.mdx,17-deploying.mdx,18-upgrading.mdx}|01-app/02-guides:{analytics.mdx,authentication.mdx,backend-for-frontend.mdx,caching.mdx,ci-build-caching.mdx,content-security-policy.mdx,css-in-js.mdx,custom-server.mdx,data-security.mdx,debugging.mdx,draft-mode.mdx,environment-variables.mdx,forms.mdx,incremental-static-regeneration.mdx,instrumentation.mdx,internationalization.mdx,json-ld.mdx,lazy-loading.mdx,local-development.mdx,mcp.mdx,mdx.mdx,memory-usage.mdx,multi-tenant.mdx,multi-zones.mdx,open-telemetry.mdx,package-bundling.mdx,prefetching.mdx,production-checklist.mdx,progressive-web-apps.mdx,redirecting.mdx,sass.mdx,scripts.mdx,self-hosting.mdx,single-page-applications.mdx,static-exports.mdx,tailwind-v3-css.mdx,third-party-libraries.mdx,videos.mdx}|01-app/02-guides/migrating:{app-router-migration.mdx,from-create-react-app.mdx,from-vite.mdx}|01-app/02-guides/testing:{cypress.mdx,jest.mdx,playwright.mdx,vitest.mdx}|01-app/02-guides/upgrading:{codemods.mdx,version-14.mdx,version-15.mdx,version-16.mdx}|01-app/03-api-reference:{07-edge.mdx,08-turbopack.mdx}|01-app/03-api-reference/01-directives:{use-cache-private.mdx,use-cache-remote.mdx,use-cache.mdx,use-client.mdx,use-server.mdx}|01-app/03-api-reference/02-components:{font.mdx,form.mdx,image.mdx,link.mdx,script.mdx}|01-app/03-api-reference/03-file-conventions/01-metadata:{app-icons.mdx,manifest.mdx,opengraph-image.mdx,robots.mdx,sitemap.mdx}|01-app/03-api-reference/03-file-conventions:{default.mdx,dynamic-routes.mdx,error.mdx,forbidden.mdx,instrumentation-client.mdx,instrumentation.mdx,intercepting-routes.mdx,layout.mdx,loading.mdx,mdx-components.mdx,not-found.mdx,page.mdx,parallel-routes.mdx,proxy.mdx,public-folder.mdx,route-groups.mdx,route-segment-config.mdx,route.mdx,src-folder.mdx,template.mdx,unauthorized.mdx}|01-app/03-api-reference/04-functions:{after.mdx,cacheLife.mdx,cacheTag.mdx,connection.mdx,cookies.mdx,draft-mode.mdx,fetch.mdx,forbidden.mdx,generate-image-metadata.mdx,generate-metadata.mdx,generate-sitemaps.mdx,generate-static-params.mdx,generate-viewport.mdx,headers.mdx,image-response.mdx,next-request.mdx,next-response.mdx,not-found.mdx,permanentRedirect.mdx,redirect.mdx,refresh.mdx,revalidatePath.mdx,revalidateTag.mdx,unauthorized.mdx,unstable_cache.mdx,unstable_noStore.mdx,unstable_rethrow.mdx,updateTag.mdx,use-link-status.mdx,use-params.mdx,use-pathname.mdx,use-report-web-vitals.mdx,use-router.mdx,use-search-params.mdx,use-selected-layout-segment.mdx,use-selected-layout-segments.mdx,userAgent.mdx}|01-app/03-api-reference/05-config/01-next-config-js:{adapterPath.mdx,allowedDevOrigins.mdx,appDir.mdx,assetPrefix.mdx,authInterrupts.mdx,basePath.mdx,browserDebugInfoInTerminal.mdx,cacheComponents.mdx,cacheHandlers.mdx,cacheLife.mdx,compress.mdx,crossOrigin.mdx,cssChunking.mdx,devIndicators.mdx,distDir.mdx,env.mdx,expireTime.mdx,exportPathMap.mdx,generateBuildId.mdx,generateEtags.mdx,headers.mdx,htmlLimitedBots.mdx,httpAgentOptions.mdx,images.mdx,incrementalCacheHandlerPath.mdx,inlineCss.mdx,isolatedDevBuild.mdx,logging.mdx,mdxRs.mdx,onDemandEntries.mdx,optimizePackageImports.mdx,output.mdx,pageExtensions.mdx,poweredByHeader.mdx,productionBrowserSourceMaps.mdx,proxyClientMaxBodySize.mdx,reactCompiler.mdx,reactMaxHeadersLength.mdx,reactStrictMode.mdx,redirects.mdx,rewrites.mdx,sassOptions.mdx,serverActions.mdx,serverComponentsHmrCache.mdx,serverExternalPackages.mdx,staleTimes.mdx,staticGeneration.mdx,taint.mdx,trailingSlash.mdx,transpilePackages.mdx,turbopack.mdx,turbopackFileSystemCache.mdx,typedRoutes.mdx,typescript.mdx,urlImports.mdx,useLightningcss.mdx,viewTransition.mdx,webVitalsAttribution.mdx,webpack.mdx}|01-app/03-api-reference/05-config:{02-typescript.mdx,03-eslint.mdx}|01-app/03-api-reference/06-cli:{create-next-app.mdx,next.mdx}|02-pages/01-getting-started:{01-installation.mdx,02-project-structure.mdx,04-images.mdx,05-fonts.mdx,06-css.mdx,11-deploying.mdx}|02-pages/02-guides:{analytics.mdx,authentication.mdx,babel.mdx,ci-build-caching.mdx,content-security-policy.mdx,css-in-js.mdx,custom-server.mdx,debugging.mdx,draft-mode.mdx,environment-variables.mdx,forms.mdx,incremental-static-regeneration.mdx,instrumentation.mdx,internationalization.mdx,lazy-loading.mdx,mdx.mdx,multi-zones.mdx,open-telemetry.mdx,package-bundling.mdx,post-css.mdx,preview-mode.mdx,production-checklist.mdx,redirecting.mdx,sass.mdx,scripts.mdx,self-hosting.mdx,static-exports.mdx,tailwind-v3-css.mdx,third-party-libraries.mdx}|02-pages/02-guides/migrating:{app-router-migration.mdx,from-create-react-app.mdx,from-vite.mdx}|02-pages/02-guides/testing:{cypress.mdx,jest.mdx,playwright.mdx,vitest.mdx}|02-pages/02-guides/upgrading:{codemods.mdx,version-10.mdx,version-11.mdx,version-12.mdx,version-13.mdx,version-14.mdx,version-9.mdx}|02-pages/03-building-your-application/01-routing:{01-pages-and-layouts.mdx,02-dynamic-routes.mdx,03-linking-and-navigating.mdx,05-custom-app.mdx,06-custom-document.mdx,07-api-routes.mdx,08-custom-error.mdx}|02-pages/03-building-your-application/02-rendering:{01-server-side-rendering.mdx,02-static-site-generation.mdx,04-automatic-static-optimization.mdx,05-client-side-rendering.mdx}|02-pages/03-building-your-application/03-data-fetching:{01-get-static-props.mdx,02-get-static-paths.mdx,03-forms-and-mutations.mdx,03-get-server-side-props.mdx,05-client-side.mdx}|02-pages/03-building-your-application/06-configuring:{12-error-handling.mdx}|02-pages/04-api-reference:{06-edge.mdx,08-turbopack.mdx}|02-pages/04-api-reference/01-components:{font.mdx,form.mdx,head.mdx,image-legacy.mdx,image.mdx,link.mdx,script.mdx}|02-pages/04-api-reference/02-file-conventions:{instrumentation.mdx,proxy.mdx,public-folder.mdx,src-folder.mdx}|02-pages/04-api-reference/03-functions:{get-initial-props.mdx,get-server-side-props.mdx,get-static-paths.mdx,get-static-props.mdx,next-request.mdx,next-response.mdx,use-report-web-vitals.mdx,use-router.mdx,userAgent.mdx}|02-pages/04-api-reference/04-config/01-next-config-js:{adapterPath.mdx,allowedDevOrigins.mdx,assetPrefix.mdx,basePath.mdx,bundlePagesRouterDependencies.mdx,compress.mdx,crossOrigin.mdx,devIndicators.mdx,distDir.mdx,env.mdx,exportPathMap.mdx,generateBuildId.mdx,generateEtags.mdx,headers.mdx,httpAgentOptions.mdx,images.mdx,isolatedDevBuild.mdx,onDemandEntries.mdx,optimizePackageImports.mdx,output.mdx,pageExtensions.mdx,poweredByHeader.mdx,productionBrowserSourceMaps.mdx,proxyClientMaxBodySize.mdx,reactStrictMode.mdx,redirects.mdx,rewrites.mdx,serverExternalPackages.mdx,trailingSlash.mdx,transpilePackages.mdx,turbopack.mdx,typescript.mdx,urlImports.mdx,useLightningcss.mdx,webVitalsAttribution.mdx,webpack.mdx}|02-pages/04-api-reference/04-config:{01-typescript.mdx,02-eslint.mdx}|02-pages/04-api-reference/05-cli:{create-next-app.mdx,next.mdx}|03-architecture:{accessibility.mdx,fast-refresh.mdx,nextjs-compiler.mdx,supported-browsers.mdx}|04-community:{01-contribution-guide.mdx,02-rspack.mdx}<!-- NEXT-AGENTS-MD-END -->
