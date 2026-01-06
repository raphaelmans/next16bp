# Database Setup

This project uses [Drizzle ORM](https://orm.drizzle.team/) with PostgreSQL (via Supabase).

## Configuration

Database configuration is located in:
- `drizzle.config.ts` - Drizzle Kit configuration
- `src/shared/infra/db/` - Database infrastructure
- `src/shared/infra/db/schema/` - Table schemas

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your database URL:

```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/dbname"
```

## Available Scripts

```bash
# Generate migration files from schema changes
pnpm db:generate

# Apply migrations to database
pnpm db:migrate

# Push schema changes directly to database (for development)
pnpm db:push

# Open Drizzle Studio (database GUI)
pnpm db:studio
```

## Creating Migrations

1. Define your schema in `src/shared/infra/db/schema/`
2. Export it from `src/shared/infra/db/schema/index.ts`
3. Run `pnpm db:generate` to create migration
4. Run `pnpm db:migrate` to apply migration (or `pnpm db:push` for development)

## Schema Organization

Following the architecture guide:
- **Tables**: Define in `src/shared/infra/db/schema/<table>.ts`
- **Types**: Generated from Drizzle schemas using `drizzle-zod`
- **Exports**: Centralized in `src/shared/infra/db/schema/index.ts`

Example:
```typescript
// src/shared/infra/db/schema/users.ts
import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema } from "drizzle-zod";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const UserSchema = createSelectSchema(users);
export const InsertUserSchema = createInsertSchema(users);
export type User = z.infer<typeof UserSchema>;
export type InsertUser = z.infer<typeof InsertUserSchema>;
```

## Transaction Management

The project uses a `TransactionManager` abstraction (see `src/shared/kernel/transaction.ts`).

Services and repositories accept optional `RequestContext` to participate in transactions:

```typescript
// Service owns transaction
await userService.create(data);

// Service participates in external transaction
await transactionManager.run(async (tx) => {
  await userService.create(data, { tx });
  await profileService.create(profile, { tx });
});
```

## Next Steps

1. Set up Supabase project
2. Add connection string to `.env.local`
3. Run `pnpm db:push` to create initial tables
4. Implement Supabase Auth integration
