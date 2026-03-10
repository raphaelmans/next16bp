# Developer Integration Overview

## Purpose

This doc set captures how the owner-side Developers dashboard and the public developer API work together in the current product.

- The dashboard is the operator setup surface for integrations, keys, mappings, precheck, and one guided live read.
- The public developer API is the external contract for read and write traffic, authenticated with `X-API-Key`.
- A full validation flow requires both surfaces: dashboard setup first, then external API smoke tests.

## Current Snapshot

- Local validation target: `http://localhost:3000`
- Owner route family: `/api/organization/organizations/:organizationId/developer-integrations/...`
- Public developer route family: `/api/developer/v1/...`
- Dashboard live execution: read-only
- Public write validation: manual `curl` against the unavailability route, followed by cleanup

## Table Of Contents

1. [Dashboard Operator Flow](./01-dashboard-operator-flow.md)
2. [Public API Read And Write Smoke Flow](./02-public-api-read-write-smoke.md)
3. [Validated Local Run Artifacts](./03-validated-local-run.md)
4. [Source Files](./99-source-files.md)

## Key Decisions

- Use one integration per external system or deployment context.
- Create a fresh smoke-test key when validating end-to-end behavior because the plaintext secret is only shown once.
- Keep the dashboard read-only even during operator testing; validate public writes outside the browser.
- Clean up any write smoke immediately with the matching `DELETE` call.

## Documentation Basis

This folder is based on:

- Repository analysis of the current developers feature and route handlers
- A validated local run completed on March 10, 2026 UTC against `http://localhost:3000`
- Existing test coverage for the client route contract, owner route handlers, helper functions, and public developer routes
