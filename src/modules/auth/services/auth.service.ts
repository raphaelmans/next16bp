import type { Session, User } from "@supabase/supabase-js";
import { logger } from "@/shared/infra/logger";
import type { IAuthRepository } from "../repositories/auth.repository";

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
  startGoogleOAuth(baseUrl: string, next?: string): Promise<{ url: string }>;
  signUp(
    email: string,
    password: string,
    baseUrl: string,
  ): Promise<{ user: User | null; session: Session | null }>;
  signOut(): Promise<void>;
  exchangeCodeForSession(
    code: string,
  ): Promise<{ user: User; session: Session }>;
  verifyMagicLink(
    tokenHash: string,
  ): Promise<{ user: User | null; session: Session | null }>;
  verifySignUp(
    tokenHash: string,
  ): Promise<{ user: User | null; session: Session | null }>;
  verifyRecovery(tokenHash: string): Promise<void>;
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
    const redirectTo = `${baseUrl}/auth/confirm`;
    const result = await this.authRepository.signInWithOtp(email, redirectTo);

    logger.info(
      { event: "user.magic_link_requested", email },
      "Magic link requested",
    );

    return result;
  }

  async startGoogleOAuth(
    baseUrl: string,
    next?: string,
  ): Promise<{ url: string }> {
    const safeNext = next?.startsWith("/") ? next : "/";
    const redirectTo = `${baseUrl}/auth/callback?next=${encodeURIComponent(safeNext)}`;
    const result = await this.authRepository.signInWithGoogleOAuth(redirectTo);

    logger.info({ event: "user.oauth_started", provider: "google" });

    return result;
  }

  async signUp(
    email: string,
    password: string,
    baseUrl: string,
  ): Promise<{ user: User | null; session: Session | null }> {
    const redirectTo = `${baseUrl}/auth/confirm`;
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

  async verifyMagicLink(
    tokenHash: string,
  ): Promise<{ user: User | null; session: Session | null }> {
    const result = await this.authRepository.verifyMagicLink(tokenHash);

    if (result.user) {
      logger.info(
        { event: "user.magic_link_verified", userId: result.user.id },
        "Magic link verified",
      );
    }

    return result;
  }

  async verifySignUp(
    tokenHash: string,
  ): Promise<{ user: User | null; session: Session | null }> {
    const result = await this.authRepository.verifySignUp(tokenHash);

    if (result.user) {
      logger.info(
        { event: "user.signup_verified", userId: result.user.id },
        "Signup verified",
      );
    }

    return result;
  }

  async verifyRecovery(tokenHash: string): Promise<void> {
    await this.authRepository.verifyRecovery(tokenHash);

    logger.info(
      { event: "user.recovery_verified" },
      "Password recovery verified",
    );
  }
}
