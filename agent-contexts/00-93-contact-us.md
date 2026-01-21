# [00-93] Contact Us Feature

> Date: 2026-01-21
> Previous: 00-92-featured-rank.md

## Summary

Implemented a public Contact Us flow with footer CTA, a new `/contact-us` page and form, and backend handling that stores submissions and sends email through a Resend strategy adapter. Added user stories and an agent plan for the feature, plus required env configuration and routing updates.

## Changes Made

### Planning

| File | Change |
|------|--------|
| `agent-plans/context.md` | Logged new 58-contact-us plan references. |
| `agent-plans/user-stories/58-contact-us/58-00-overview.md` | Added contact us story overview. |
| `agent-plans/user-stories/58-contact-us/58-01-public-contact-inquiry.md` | Defined contact inquiry user story. |
| `agent-plans/58-contact-us/58-00-overview.md` | Added master plan and phases. |
| `agent-plans/58-contact-us/58-01-foundation.md` | Documented schema + email strategy work. |
| `agent-plans/58-contact-us/58-02-backend-api.md` | Documented backend module APIs. |
| `agent-plans/58-contact-us/58-03-ui.md` | Documented UI + CTA implementation. |
| `agent-plans/58-contact-us/contact-us-dev1-checklist.md` | Added dev checklist. |

### Backend + Infra

| File | Change |
|------|--------|
| `src/shared/infra/db/schema/contact-message.ts` | Added contact_message table schema. |
| `src/shared/infra/db/schema/index.ts` | Exported contact message schema. |
| `src/shared/infra/email/email-service.ts` | Added email strategy interface. |
| `src/shared/infra/email/resend-email.service.ts` | Implemented Resend adapter. |
| `src/shared/infra/email/email.factory.ts` | Added email service factory. |
| `src/modules/contact/dtos/submit-contact-message.dto.ts` | Added submit DTO + Zod schema. |
| `src/modules/contact/repositories/contact-message.repository.ts` | Added contact repository. |
| `src/modules/contact/services/contact.service.ts` | Added contact service with email delivery. |
| `src/modules/contact/errors/contact.errors.ts` | Added contact email failure error. |
| `src/modules/contact/factories/contact.factory.ts` | Added contact module factory. |
| `src/modules/contact/contact.router.ts` | Added contact router mutation. |
| `src/shared/infra/trpc/root.ts` | Registered contact router. |
| `src/lib/env/index.ts` | Added Resend + contact email env vars. |
| `.env.example` | Added Resend/contact env placeholders. |
| `package.json` | Added `resend` dependency. |
| `pnpm-lock.yaml` | Updated lockfile for Resend. |

### Frontend

| File | Change |
|------|--------|
| `src/shared/lib/app-routes.ts` | Added `contactUs` route + public base. |
| `src/features/discovery/components/footer.tsx` | Updated contact link + added CTA button. |
| `next.config.ts` | Redirect `/contact` → `/contact-us`. |
| `src/features/contact/components/contact-us-form.tsx` | Added contact form UI + submit handling. |
| `src/features/contact/hooks/use-submit-contact-message.ts` | Added submit mutation hook. |
| `src/features/contact/index.ts` | Feature export barrel. |
| `src/app/(public)/contact-us/page.tsx` | Added public contact page layout. |

## Key Decisions

- Used a strategy adapter (`EmailServiceStrategy`) with Resend implementation to keep email delivery swappable.
- Saved contact submissions before email send, and update delivery status after send to avoid data loss.
- Added `/contact` redirect to preserve old link behavior.

## Next Steps

- [ ] Ensure `.env.local` has `RESEND_API_KEY`, `CONTACT_US_FROM_EMAIL`, `CONTACT_US_TO_EMAIL`.
- [ ] Run `pnpm lint` after env is set.

## Commands to Continue

```bash
pnpm lint
pnpm dev
```
