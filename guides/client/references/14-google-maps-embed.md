# Google Maps Embed API (Key Setup)

This guide configures the key used by our iframe embeds:

- Env var: `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY`
- Used by: `/poc/google-loc` (and future place onboarding UX)

> The key is embedded into the iframe URL, so treat it as **public** and rely on **restrictions** (referrer + API restrictions) for safety.

---

## 1) Create/choose a Google Cloud project

1. Go to the Google Cloud Console.
2. Select an existing project or create a new one.
3. Ensure billing is enabled for the project (Maps Embed API setup requires account + billing prerequisites per the Embed docs).

---

## 2) Enable the Maps Embed API

Enable the API in your project:

- Maps Embed API docs: https://developers.google.com/maps/documentation/embed/get-api-key

---

## 3) Create an API key

1. Go to **Google Maps Platform → Credentials**.
2. Create an **API key**.

---

## 4) Restrict the API key (important)

Google’s security guidance recommends restricting keys to avoid unauthorized usage:

- Security best practices: https://developers.google.com/maps/api-security-best-practices

### Application restrictions

Set **Websites** restrictions:

- Local dev: `http://localhost:3000/*`
- Production: `https://your-domain.com/*`
- Optional: Preview deployments, e.g. `https://*.vercel.app/*`

Notes:
- Prefer HTTPS domains in production.
- Avoid over-broad wildcards if you can.

### API restrictions

Set **API restrictions** to only allow:
- **Maps Embed API**

---

## 5) Add the key to your env

In `.env.local`:

```bash
NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY="your_key_here"
```

Keep `.env.local` uncommitted.

---

## 6) Iframe referrer policy

If your site sets a restrictive referrer policy (for example `no-referrer`), Google may not receive the `Referer` header and referrer-based restrictions can fail.

For embeds, prefer setting an explicit iframe policy:

```html
<iframe referrerpolicy="no-referrer-when-downgrade" />
```

The official Embed docs call this out as a common reason referrer restrictions fail.

---

## 7) Quick verification

1. Start dev server: `pnpm dev`
2. Open: `/poc/google-loc`
3. Paste a URL like:

- `https://maps.app.goo.gl/6AGA5vZkzKazGswRA`

Expected:
- Server resolves to a `google.com/maps/place/...` URL.
- Coordinates appear.
- Iframe embed renders.

---

## Cost notes

Maps Embed API usage is available at no charge and doesn’t have short-term or daily usage limits per the Embed usage/billing docs:

- https://developers.google.com/maps/documentation/embed/usage-and-billing

(Still: always restrict keys; you are responsible for charges from abuse of unrestricted keys across Google Maps Platform.)
