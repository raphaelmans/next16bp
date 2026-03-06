# Cursor Pointer — Summary

## Artifacts
| File | Description |
|------|-------------|
| `specs/cursor-pointer/rough-idea.md` | Original concept |
| `specs/cursor-pointer/requirements.md` | Q&A record (4 questions) |
| `specs/cursor-pointer/research/component-audit.md` | Full audit of all 55 shadcn-ui component files |
| `specs/cursor-pointer/design.md` | Detailed design with component tables and acceptance criteria |
| `specs/cursor-pointer/plan.md` | 6-step implementation plan |

## Overview
Add `cursor-pointer` to all clickable shadcn-ui components across 17 files. Split into two change types:
- **Add** `cursor-pointer` to 19 components that have no cursor class
- **Replace** `cursor-default` with `cursor-pointer` in 15 menu/select item components

10+ additional components inherit the fix automatically through composition (`<Button>`, `buttonVariants`, `toggleVariants`).

## Next Steps
- Implement via the 6-step plan in `plan.md`
- Validate with `pnpm lint` and grep verification
