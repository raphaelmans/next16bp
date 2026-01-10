import type { CookieMethodsServer } from "@supabase/ssr";
import { env } from "@/lib/env";
import { makeUserRoleService } from "@/modules/user-role/factories/user-role.factory";
import { getContainer } from "@/shared/infra/container";
import { createClient } from "@/shared/infra/supabase/create-client";
import { AuthRepository } from "../repositories/auth.repository";
import { AuthService } from "../services/auth.service";
import { RegisterUserUseCase } from "../use-cases/register-user.use-case";

/**
 * Auth factories are REQUEST-SCOPED (not lazy singletons)
 * because Supabase client needs request-specific cookies.
 */
export function makeAuthRepository(cookies: CookieMethodsServer) {
  const client = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SECRET_KEY,
    cookies,
  );
  return new AuthRepository(client);
}

export function makeAuthService(cookies: CookieMethodsServer) {
  return new AuthService(makeAuthRepository(cookies));
}

export function makeRegisterUserUseCase(cookies: CookieMethodsServer) {
  return new RegisterUserUseCase(
    makeAuthService(cookies),
    makeUserRoleService(),
    getContainer().transactionManager,
  );
}
