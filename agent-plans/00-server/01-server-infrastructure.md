# Pre-Phase: Infrastructure Modules

**Assigned to:** Agent 0  
**Dependencies:** None (can start immediately)  
**Blocks:** All Phase 1+ modules

---

## Module 0A: Rate Limiting Infrastructure

### Overview

Implement rate limiting using Upstash Ratelimit to protect API endpoints from abuse and ensure fair usage.

### Technology Stack

| Package | Purpose |
|---------|---------|
| `@upstash/ratelimit` | Rate limiting library |
| `@upstash/redis` | Redis client for serverless |

### Files to Create

```
src/shared/infra/ratelimit/
├── config.ts           # Rate limit tier configurations
├── ratelimit.ts        # Rate limiter factory
└── index.ts            # Exports

src/shared/infra/trpc/middleware/
└── ratelimit.middleware.ts  # tRPC middleware
```

### Rate Limit Tiers

| Tier | Limit | Window | Use Case |
|------|-------|--------|----------|
| `default` | 100 requests | 1 minute | Standard read endpoints |
| `auth` | 10 requests | 1 minute | Login, register |
| `mutation` | 30 requests | 1 minute | Create/update operations |
| `sensitive` | 5 requests | 1 minute | Reservation creation, claim submission |

### Implementation Details

#### config.ts

```typescript
export const RATE_LIMIT_TIERS = {
  default: { requests: 100, window: "1 m" },
  auth: { requests: 10, window: "1 m" },
  mutation: { requests: 30, window: "1 m" },
  sensitive: { requests: 5, window: "1 m" },
} as const;

export type RateLimitTier = keyof typeof RATE_LIMIT_TIERS;
```

#### ratelimit.ts

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { RATE_LIMIT_TIERS, RateLimitTier } from "./config";

// Create rate limiters for each tier
export function createRateLimiter(tier: RateLimitTier): Ratelimit {
  const config = RATE_LIMIT_TIERS[tier];
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(config.requests, config.window),
    prefix: `@kudoscourts/ratelimit/${tier}`,
    analytics: true,
  });
}
```

#### ratelimit.middleware.ts

```typescript
import { TRPCError } from "@trpc/server";
import { createRateLimiter, RateLimitTier } from "../ratelimit";
import { RateLimitError } from "@/shared/kernel/errors";

export function createRateLimitMiddleware(tier: RateLimitTier) {
  const limiter = createRateLimiter(tier);
  
  return t.middleware(async ({ ctx, next }) => {
    // Use userId if authenticated, otherwise use IP
    const identifier = ctx.userId ?? ctx.requestId; // fallback to requestId or IP
    
    const { success, limit, remaining } = await limiter.limit(identifier);
    
    if (!success) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Rate limit exceeded. Please try again later.",
        cause: new RateLimitError("Rate limit exceeded", { limit, remaining }),
      });
    }
    
    return next({ ctx });
  });
}
```

### tRPC Procedure Updates

Add to `src/shared/infra/trpc/trpc.ts`:

```typescript
// Rate-limited procedures
export const rateLimitedProcedure = (tier: RateLimitTier) =>
  publicProcedure.use(createRateLimitMiddleware(tier));

export const protectedRateLimitedProcedure = (tier: RateLimitTier) =>
  protectedProcedure.use(createRateLimitMiddleware(tier));
```

### Environment Variables

Add to `.env.local.example`:

```bash
# Upstash Redis (for rate limiting)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

### Testing Checklist

- [ ] Rate limiter correctly limits requests per tier
- [ ] Authenticated users use userId as identifier
- [ ] Anonymous users use IP/requestId as identifier
- [ ] 429 response returned when limit exceeded
- [ ] Different tiers have independent limits

---

## Module 0B: Admin Role System

### Overview

Extend the existing user roles system to support admin functionality for claim approvals and court management.

### Current State

- `user_roles` table exists with `role` text field
- Session type already supports `"admin" | "member" | "viewer"`
- Auth context fetches role from database

### Files to Create/Modify

```
src/shared/infra/trpc/trpc.ts           # Add adminProcedure
src/shared/kernel/auth.ts               # Verify Role type (already correct)
src/modules/user-role/                   # May need updates
```

### Implementation Details

#### Add adminProcedure to trpc.ts

```typescript
// Admin middleware - requires admin role
const adminMiddleware = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session || !ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
      cause: new AuthenticationError("Authentication required"),
    });
  }
  
  if (ctx.session.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
      cause: new AuthorizationError("Admin access required"),
    });
  }
  
  return next({ ctx: ctx as AuthenticatedContext });
});

// Admin procedure - requires admin role
export const adminProcedure = loggedProcedure.use(adminMiddleware);

// Admin with rate limiting
export const adminRateLimitedProcedure = (tier: RateLimitTier) =>
  adminProcedure.use(createRateLimitMiddleware(tier));
```

#### Role Values

The `user_roles.role` field should support:

| Role | Description |
|------|-------------|
| `member` | Default role, standard user |
| `admin` | Platform administrator |
| `viewer` | Read-only access (future) |

### Admin Assignment (Deferred)

**DEFERRED:** How to create the first admin user will be decided later. Options:
- Environment variable with admin email
- Seed script
- Admin invitation flow

For now, admins can be created by manually updating the database:

```sql
UPDATE user_roles SET role = 'admin' WHERE user_id = '<user-uuid>';
```

### Testing Checklist

- [ ] adminProcedure rejects unauthenticated requests
- [ ] adminProcedure rejects non-admin users
- [ ] adminProcedure allows admin users
- [ ] Error messages are appropriate

---

## Deferred Items (Infrastructure)

| Item | Description | Reason |
|------|-------------|--------|
| Upstash Redis Setup | Creating and configuring Upstash Redis instance | Deferred - setup when ready |
| Admin Seeding | How to create first admin user | Deferred - decide later |
| Rate Limit Headers | Include X-RateLimit-* headers in responses | MVP: 429 only |

---

## Completion Criteria

- [ ] Rate limiting infrastructure complete and tested
- [ ] All rate limit tiers configured
- [ ] adminProcedure available in tRPC
- [ ] Environment variables documented
- [ ] No TypeScript errors
