# Firecrawl Source Strategy

## Purpose

This document captures the production-ready Firecrawl strategy for curated court discovery and scraping.

The key rule is:

- do not treat every discovered URL the same

Different host types require different Firecrawl workflows.

## Canonical Escalation

Use Firecrawl in this order:

1. `search`
2. `map`
3. `scrape`
4. fallback policy

Only use browser automation when a site class truly requires it.

## Source Classes

### `map_static_directory`

Examples:

- `cebupickleballcourts.com`

Behavior:

- treat the domain as a directory host
- do not rely on search ranking alone
- run a host-level `map` using the city name
- prefer mapped detail pages over generic search results
- if generic extract returns no rows, use the known static-page fallback parser

Why:

- Firecrawl `map` can surface the correct detail page even when web search ranks social/noisy results higher
- direct detail pages on these domains often contain stable HTML structure

### `map_spa_directory`

Examples:

- `dumapickleball.com`

Behavior:

- treat the domain as a discovery signal, not a normal scrape target
- run `map` to understand the route space
- do not feed mapped SPA detail routes directly into the generic scraper by default
- prefer alternative extractable sources discovered alongside it, such as:
  - `pickleheads.com`
  - `setmore.com`
  - other structured booking/detail pages

Why:

- plain Firecrawl `scrape` on these SPA detail routes can return the onboarding shell instead of court data
- the domain is useful for discovery, but not necessarily for generic extraction

### `lead_only`

Examples:

- `facebook.com`
- `instagram.com`
- `tiktok.com`
- `reddit.com`
- `playpickleball.com`

Behavior:

- allow them to appear in discovery research
- do not let them dominate `leads.urls.txt`
- do not send them to the generic scraper as primary venue sources

Why:

- they are often socially useful but operationally noisy
- they do not consistently produce importer-ready venue records

### `direct`

Examples:

- `pickleheads.com` venue pages
- `setmore.com` booking pages
- other venue-level pages with stable detail content

Behavior:

- emit directly to `leads.urls.txt`
- send to the generic scraper
- let duplicate preflight decide whether the venue is new

## Query Strategy

Use city-first pickleball queries first:

- `pickleball courts in <province> <city>`
- `pickleball court <city> <province>`
- `<city> pickleball`
- `courts in <city> <province> pickleball`
- `sports center <city> <province> pickleball`
- `pickleball club <city> <province>`
- `pickleball reservations <city> <province>`

Then add structured fallback queries:

- `site:pickleheads.com ...`
- `site:playtimescheduler.com ...`
- `site:app.court-access.com ...`
- `dink <city> pickleball`

Known domain queries may also be added for configured directory hosts, but the behavior is still host-driven, not province-driven.

## Current Practical Rules

- If a known static directory host is discovered, `map` it and prefer detail pages.
- If a known SPA directory host is discovered, do not trust normal `scrape` on its detail routes.
- If discovery returns only lead-only domains, keep searching instead of sending them directly to extraction.
- If a static venue page still fails generic extract, use the site-specific static fallback parser when available.

## Operational Goal

The final `leads.urls.txt` should mostly contain:

- direct venue detail pages
- booking/detail pages
- domains that the generic scraper or a known fallback can actually convert into curated rows

It should not primarily contain:

- social pages
- discussion threads
- generic aggregator city pages
- SPA routes that only render onboarding shells to generic scrape
