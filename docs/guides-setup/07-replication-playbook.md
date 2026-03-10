# Replication Playbook

## Target stack

This playbook assumes the destination repo uses the same stack:

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui

## Recommended implementation order

### Phase 1: Set up the route and generic guide system

1. Create `src/app/(public)/guides/page.tsx`.
2. Create `src/app/(public)/guides/[slug]/page.tsx`.
3. Create `src/features/guides/content/guides.ts`.
4. Create `src/features/guides/pages/guides-index-page.tsx`.
5. Create `src/features/guides/pages/guide-article-page.tsx`.
6. Add `generateStaticParams()` and `generateMetadata()`.

At this point you can ship plain guides.

### Phase 2: Add the interactive guide shell

1. Create `interactive-guide-types.ts`.
2. Create `interactive-guide-article-page.tsx`.
3. Create `guide-snippet-wrapper.tsx`.
4. Create one interactive guide content file.
5. Create one interactive guide snippet file.
6. Create one guide-specific article entry component.
7. Branch on the target slug in `[slug]/page.tsx`.

At this point you can ship one rich guide.

### Phase 3: Add more interactive guides carefully

For each additional rich guide:

1. Add the slug to `guides.ts`.
2. Add the base metadata entry to `GUIDE_ENTRIES`.
3. Add one `*-content.ts` file.
4. Add one `*-snippets.tsx` file.
5. Add one `*-article-page.tsx` file.
6. Register the guide in the route switch.

Do not collapse many guides into one giant content file.

## Authoring rules to preserve

### Route rules

- Route files stay thin.
- Feature files own rendering.
- Metadata is computed at the route boundary.

### Content rules

- Keep guide metadata centralized.
- Keep interactive sections typed and explicit.
- Use stable section ids because snippet mapping depends on them.

### Preview rules

- Reuse production components first.
- Use inert wrappers for previews.
- Copy components only for preview rendering when direct reuse is unsafe.
- Keep copied previews visually aligned with production.

## Recommended destination folder structure

```text
docs/
  guides-setup/
    README.md
    01-architecture-overview.md
    02-file-map.md
    03-content-model-and-slugs.md
    04-interactive-article-shell.md
    05-snippet-preview-pattern.md
    06-seo-routing-and-metadata.md
    07-replication-playbook.md
```

And in the app code:

```text
src/
  app/(public)/guides/
  features/guides/
```

## Anti-patterns to avoid

- Putting guide-only UI modules under `src/app/**`.
- Mixing content data and React snippet components in the same file when the file becomes hard to scan.
- Letting snippet previews perform real mutations.
- Using raw slug strings in multiple files.
- Building the whole system as client-only when the route can remain server-first.
- Treating preview copies as disposable. They are UI parity artifacts and need maintenance.

## Minimal acceptance criteria for the new repo

The replication is correct when all of these are true:

1. The guides index route is metadata-driven and feature-owned.
2. The `[slug]` route statically enumerates known guide slugs.
3. Plain guides render from a typed content registry.
4. At least one rich guide renders from a section schema plus snippet resolver.
5. Preview snippets are inert and visually representative.
6. The route emits canonical metadata and JSON-LD.
7. The code respects the same route-boundary architecture used here.

## Final recommendation

Do not try to start with the most abstract version. Replicate the current system closely first:

- one registry
- one generic article page
- one interactive shell
- one or two high-value interactive guides

After that, only add more abstraction if the guide count or authoring workflow proves it necessary.
