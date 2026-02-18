# tRPC-Retained Adapter Pattern

## Purpose

Keep tRPC as transport while enforcing the architecture chain:

`components -> query adapter hooks -> featureApi -> tRPC transport`

## Design Principles

1. Components never call transport directly.
2. Query adapters own cache behavior and invalidation.
3. Feature APIs own endpoint-scoped contracts and mapping.
4. UI branches on normalized client-safe errors, not provider-specific shapes.

## Required Public Contracts

For each feature module:

- `I<Feature>Api`
- `<Feature>ApiDeps`
- `class <Feature>Api implements I<Feature>Api`
- `create<Feature>Api(deps)` factory

Example (`src/features/auth/api.ts`):

```ts
import type { AppError } from "@/common/errors/app-error";

export interface IAuthApi {
  login(input: LoginInput): Promise<LoginResult>;
  me(): Promise<SessionUser | null>;
}

export type AuthApiDeps = {
  trpcClient: TrpcClientAdapter;
  toAppError: (error: unknown) => AppError;
};

export class AuthApi implements IAuthApi {
  constructor(private readonly deps: AuthApiDeps) {}

  async login(input: LoginInput): Promise<LoginResult> {
    try {
      const dto = await this.deps.trpcClient.auth.login.mutate(input);
      return mapLoginDto(dto);
    } catch (error) {
      throw this.deps.toAppError(error);
    }
  }

  async me(): Promise<SessionUser | null> {
    try {
      const dto = await this.deps.trpcClient.auth.me.query();
      return dto ? mapSessionUserDto(dto) : null;
    } catch (error) {
      throw this.deps.toAppError(error);
    }
  }
}

export const createAuthApi = (deps: AuthApiDeps): IAuthApi =>
  new AuthApi(deps);
```

## Query Adapter Pattern

Example (`src/features/auth/hooks.ts`):

```ts
import { useMutation, useQuery } from "@tanstack/react-query";
import { trpc } from "@/trpc/client";
import { getAuthApi } from "./api.runtime";

export function useQueryAuthSession() {
  const api = getAuthApi();

  return useQuery({
    queryKey: ["auth", "session"],
    queryFn: () => api.me(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useMutAuthLogin() {
  const api = getAuthApi();
  const utils = trpc.useUtils();

  return useMutation({
    mutationFn: (input: LoginInput) => api.login(input),
    onSuccess: async () => {
      await utils.auth.me.invalidate();
    },
  });
}
```

## Transitional Compatibility Rule

For this remediation pass, strict FeatureApi is locked. Direct `trpc.<proc>.useQuery/useMutation` usage is not allowed in feature hooks at cutover and is enforced by architecture gates.

## Error Normalization Contract

Create and standardize a client-safe error contract under `src/common/errors`.

### Required Type

```ts
export type AppErrorKind =
  | "validation"
  | "auth"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "rate_limit"
  | "unexpected";

export type AppError = {
  kind: AppErrorKind;
  code: string;
  message: string;
  requestId?: string;
  details?: unknown;
};
```

### Required Normalizer

`toAppError(error: unknown): AppError` must:

1. detect tRPC client errors
2. map known server codes to `AppError.kind`
3. preserve `requestId` and structured details when present
4. return fallback `unexpected` on unknown input

## Invalidation Ownership Rules

### Default (Preferred)

Hook-owned invalidation inside mutation hooks.

Use when invalidation semantics are shared across multiple screens.

### Allowed Coordinator

`useMod*` coordinator hooks may orchestrate mutation + invalidate + navigate sequencing. Route pages and presentation components must not own invalidation.

### Mandatory Rules

1. Invalidate specific scopes only; avoid broad cache wipes.
2. Batch invalidations with `Promise.all` when multiple scopes are required.
3. Keep invalidation logic out of presentation components.

## Migration Steps per Feature

1. Add `api.ts` with interface/class/factory and method signatures.
2. Add runtime wiring (`api.runtime.ts`) to build feature API with dependencies.
3. Update `hooks.ts` to consume feature API methods.
4. Move remaining direct transport calls from components/pages into hooks.
5. Normalize errors with `toAppError` and expose UI-safe messages.
6. Keep behavior parity and run feature smoke checks.

## Test Strategy by Layer

- `api.ts`: unit tests with mocked transport + mocked `toAppError`.
- `hooks.ts`: query/mutation behavior tests using mocked `I<Feature>Api`.
- Components: hook-level mocks only; no transport mocks.
