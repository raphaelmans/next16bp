# 23 - Google Maps URL → Embed PoC (User Stories)

## US-23-01: Developer can paste a Google Maps URL and preview an embed

As a developer/admin,
I want to paste a Google Maps URL (including `maps.app.goo.gl` short links),
so that I can preview the resolved coordinates and an embedded map.

### Acceptance Criteria

- Given a `maps.app.goo.gl/...` URL, the system resolves it to a `google.com/maps/...` URL.
- The system extracts `lat/lng/zoom` from the resolved URL (marker preferred).
- If `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` is configured, the system renders an iframe embed.
- If the key is missing, the system still shows parsed coordinates and a clear warning.
- The server rejects redirects to non-Google hosts.
