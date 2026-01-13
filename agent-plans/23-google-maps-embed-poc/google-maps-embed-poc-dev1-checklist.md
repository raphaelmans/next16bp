# Developer 1 Checklist

**Focus Area:** PoC URL resolution + embed preview  
**Modules:** 1A, 2A, 3A, 4A

---

## Module 1A: Env + key guide

- [ ] Add `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` to `src/lib/env/index.ts`
- [ ] Add `.env.example` entry
- [ ] Write guide `guides/client/references/14-google-maps-embed.md`

## Module 2A: API route

- [ ] Implement `POST /api/poc/google-loc`
- [ ] Enforce allowlist on *every* redirect hop
- [ ] Parse marker coords (`!3d...!4d...`) and fallback center (`@lat,lng,zoomz`)

## Module 3A: PoC UI

- [ ] Create page `/poc/google-loc`
- [ ] Show resolved URL + parsed fields
- [ ] Render iframe embed if key configured

## Module 4A: Hardening

- [ ] Ensure no body download required for redirects (prefer `HEAD`)
- [ ] Ensure error messages are user-safe

## Validation

- [ ] `pnpm lint`
- [ ] `pnpm build`
