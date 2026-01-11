# [00-14] Vercel Lockfile Fix

> Date: 2026-01-11
> Previous: 00-13-owner-reservation-ops.md

## Summary

Investigated the latest failed `kudoscourts` production deployment on Vercel and identified the failure as a pnpm frozen lockfile mismatch. Confirmed the repository `main` branch already contains a follow-up commit intended to address the lockfile/build issue.

## Changes Made

### Investigation

| Item | Result |
|------|--------|
| Vercel deployment | `dpl_8eGYnCXfksWc96aFeP8WPsh28TPD` (`state=ERROR`) |
| Failure | `ERR_PNPM_OUTDATED_LOCKFILE` during `pnpm install` (frozen lockfile) |
| Details | Lockfile specifiers didn’t match `package.json`; pnpm reported removed deps `@react-grab/opencode` and `react-grab` |

### Local Verification

| Command | Result |
|---------|--------|
| `pnpm build` | Succeeds locally |

## Key Decisions

- Kept the local patch minimal (no unrelated formatting/refactors) since the Vercel failure happened during dependency install.

## Next Steps (if applicable)

- [ ] Trigger a new production deployment on Vercel from the latest `main` commit (or redeploy the most recent successful deployment).
- [ ] Re-check the Vercel build logs to confirm `pnpm install` succeeds.

## Commands to Continue

```bash
# Verify project still builds
pnpm build

# See latest Vercel deployments (via MCP)
# (Use Vercel MCP tools: list deployments / build logs)
```
