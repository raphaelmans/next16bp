# Instruction Context (AGENTS.md and CLAUDE.md)

This guide defines how to write and maintain `AGENTS.md` and `CLAUDE.md` for this repo.
Both files must stay 1:1 in content and structure (the Next.js docs index block is generated per file).

## Core Rules (Must Follow)
- Keep content short and high-signal. If a line can be removed without causing mistakes, remove it.
- Only include rules that are not obvious from the codebase or standard language behavior.
- Prefer links to local `@guides/` docs instead of duplicating details.
- Avoid external URLs in instructions. Use local references only.
- Use bullets, not long paragraphs. No file-by-file walkthroughs.
- Call out critical rules explicitly (e.g., "IMPORTANT", "MUST").

## Required Sections (AGENTS.md and CLAUDE.md)
- Commands (dev, build, lint, DB scripts, any non-obvious scripts)
- Stack (framework, major libraries, lint/format)
- Architecture (real project layout, not idealized)
- Conventions (frontend + backend highlights)
- Environment (required env vars, setup quirks)
- Documentation references (point to `@guides/`)
- Next.js docs index block (auto-generated)

## Local Documentation References
Use these as the canonical references in both files:
- `@guides/README.md` (unified architecture index)
- `@guides/client/README.md` (frontend architecture entry point)
- `@guides/server/README.md` (backend architecture entry point)

## Repository Architecture Snapshot (Current)
Use this to keep AGENTS/CLAUDE aligned with reality.
- `src/app/` for App Router routes and layouts
- `src/features/` for frontend feature modules
- `src/components/` for shared UI primitives and StandardForm
- `src/shared/` for server kernel, infra, and shared utilities
- `src/modules/` for backend domain modules
- `src/shared/lib/` for cross-feature helpers used by client and server
- `src/lib/` for small app-level utilities (e.g., `env`, `slug`, `cn`)
- `src/trpc/` for client-side tRPC setup

## Target Rule: Server-Only in src/lib
We want all server-only code to live under `src/lib/`, and no client/browser code should sit there.
Until the migration happens, document any exceptions explicitly in AGENTS/CLAUDE if they matter to a task.
If you add new server-only code, place it under `src/lib/` and keep it free of client imports.

## Custom Instructions (opencode.json)
If you enable custom instructions, point only to local guides.

Example:
```json
{
  "instructions": [
    "guides/context.md",
    "guides/README.md",
    "guides/client/README.md",
    "guides/server/README.md"
  ]
}
```

## Update Workflow
- Any change to `AGENTS.md` must be mirrored in `CLAUDE.md` (1:1).
- If architecture or conventions change, update `@guides/` first, then the instruction files.
- Keep the Next.js docs index block generated via `npx @next/codemod agents-md`.
