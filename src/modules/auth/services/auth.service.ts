import type { IAuthRepository } from "../repositories/auth.repository";
import type { User, Session } from "@supabase/supabase-js";
import { logger } from "@/shared/infra/logger";

/**
 * Interface for authentication service.
 * Defines the contract for auth business logic.
 */
export interface IAuthService {
  getCurrentUser(): Promise<User | null>;
  signIn(
    email: string,
    password: string,
  ): Promise<{ user: User; session: Session }>;
  signInWithMagicLink(
    email: string,
    baseUrl: string,
  ): Promise<{ user: User | null; session: Session | null }>;
  signUp(
    email: string,
    password: string,
    baseUrl: string,
  ): Promise<{ user: User | null; session: Session | null }>;
  signOut(): Promise<void>;
  exchangeCodeForSession(
    code: string,
  ): Promise<{ user: User; session: Session }>;
}

/**
 * AuthService provides business logic around authentication.
 * Thin layer that adds redirect URL construction and business event logging.
 */
export class AuthService implements IAuthService {
  constructor(private authRepository: IAuthRepository) {}

  async getCurrentUser(): Promise<User | null> {
    return this.authRepository.getCurrentUser();
  }

  async signIn(
    email: string,
    password: string,
  ): Promise<{ user: User; session: Session }> {
    const result = await this.authRepository.signInWithPassword(
      email,
      password,
    );

    logger.info(
      { event: "user.logged_in", userId: result.user.id, email },
      "User logged in",
    );

    return result;
  }

  async signInWithMagicLink(
    email: string,
    baseUrl: string,
  ): Promise<{ user: User | null; session: Session | null }> {
    const redirectTo = `${baseUrl}/auth/callback`;
    const result = await this.authRepository.signInWithOtp(email, redirectTo);

    logger.info(
      { event: "user.magic_link_requested", email },
      "Magic link requested",
    );

    return result;
  }

  async signUp(
    email: string,
    password: string,
    baseUrl: string,
  ): Promise<{ user: User | null; session: Session | null }> {
    const redirectTo = `${baseUrl}/auth/callback`;
    const result = await this.authRepository.signUp(
      email,
      password,
      redirectTo,
    );

    if (result.user) {
      logger.info(
        { event: "user.registered", userId: result.user.id, email },
        "User registered",
      );
    }

    return result;
  }

  async signOut(): Promise<void> {
    await this.authRepository.signOut();

    logger.info({ event: "user.logged_out" }, "User logged out");
  }

  async exchangeCodeForSession(
    code: string,
  ): Promise<{ user: User; session: Session }> {
    const result = await this.authRepository.exchangeCodeForSession(code);

    if (result.user) {
      logger.info(
        { event: "user.session_exchanged", userId: result.user.id },
        "Session exchanged from code",
      );
    }

    return result;
  }
}
