# Developer 1 Checklist

**Focus Area:** Public UI Google Maps embeds  
**Modules:** 5A

---

## Module 5A: Discovery + reservation embed UI

**Reference:** `agent-plans/23-google-maps-embed-poc/23-02-embed-ui.md`  
**User Story:** `US-23-01`

### Setup

- [ ] Confirm embed key guidance in `guides/client/references/14-google-maps-embed.md`
- [ ] Review discovery map view layout expectations

### Implementation

- [ ] Add shared `GoogleMapsEmbed` component
- [ ] Replace discovery `PlaceMap` placeholder with embed preview
- [ ] Add map preview and external map links in reservation details

### Testing

- [ ] `pnpm lint`
- [ ] `pnpm build`

### Handoff

- [ ] Update `agent-contexts` after implementation
