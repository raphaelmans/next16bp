# SMS Integration (Semaphore)

## Overview
Semaphore provides SMS delivery for Philippine numbers via a simple HTTP API.

Docs:
- https://www.semaphore.co/docs

## Endpoints
Base URL: `https://api.semaphore.co/api/v4`

- Send SMS (regular): `POST /messages` (rate limit: 120/min)
- Send SMS (priority): `POST /priority` (not rate limited; 2 credits / 160 chars)
- OTP: `POST /otp` (not rate limited; 2 credits / 160 chars)
- Retrieve messages: `GET /messages` (rate limit: 30/min)
- Account info: `GET /account` (rate limit: 2/min)

## Request format
Semaphore accepts `application/x-www-form-urlencoded`.

Required:
- `apikey`
- `number` (comma-separated; up to 1000)
- `message`

Optional:
- `sendername` (defaults to "SEMAPHORE")

Gotchas:
- Messages starting with `TEST` are silently ignored.
- Messages over 160 chars are auto-split into multiple segments.

## Environment variables
- `SEMAPHORE_API_KEY`
- `SEMAPHORE_SENDER_NAME` (optional)
- `SEMAPHORE_BASE_URL` (optional; default `https://api.semaphore.co/api/v4`)

## Adapter notes
- Normalize PH numbers via `normalizePhMobile()`.
- Capture `message_id` for auditing and troubleshooting.
