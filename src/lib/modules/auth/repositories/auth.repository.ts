import type { Session, User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@/lib/shared/infra/supabase/types";
import {
  AuthOAuthStartFailedError,
  AuthOtpInvalidOrExpiredError,
  EmailNotVerifiedError,
  InvalidCredentialsError,
  UserAlreadyExistsError,
} from "../errors/auth.errors";

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const getErrorMessage = (error: unknown): string | null => {
  if (!error) return null;
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return null;
};

const isTokenExpiredOrInvalidError = (error: unknown) =>
  Boolean(getErrorMessage(error)?.includes("Token has expired or is invalid"));

/**
 * Interface for authentication repository.
 * Defines the contract for auth data access.
 */
export interface IAuthRepository {
  getCurrentUser(): Promise<User | null>;
  signInWithPassword(
    email: string,
    password: string,
  ): Promise<{ user: User; session: Session }>;
  requestEmailOtp(
    email: string,
    shouldCreateUser: boolean,
  ): Promise<{ user: User | null; session: Session | null }>;
  verifyEmailOtp(
    email: string,
    token: string,
  ): Promise<{ user: User | null; session: Session | null }>;
  signInWithOtp(
    email: string,
    redirectTo: string,
  ): Promise<{ user: User | null; session: Session | null }>;
  signInWithGoogleOAuth(redirectTo: string): Promise<{ url: string }>;
  signUp(
    email: string,
    password: string,
    redirectTo: string,
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
  verifySignUpOtp(
    email: string,
    token: string,
  ): Promise<{ user: User | null; session: Session | null }>;
  resendSignUpOtp(email: string, redirectTo: string): Promise<void>;
  verifyRecovery(tokenHash: string): Promise<void>;
}

/**
 * AuthRepository wraps Supabase Auth client.
 * Maps Supabase errors to our domain errors.
 */
export class AuthRepository implements IAuthRepository {
  constructor(private client: SupabaseClient) {}

  async getCurrentUser(): Promise<User | null> {
    const {
      data: { user },
      error,
    } = await this.client.auth.getUser();
    if (error) throw error;
    return user;
  }

  async signInWithPassword(
    email: string,
    password: string,
  ): Promise<{ user: User; session: Session }> {
    const normalizedEmail = normalizeEmail(email);
    const { data, error } = await this.client.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        throw new InvalidCredentialsError();
      }
      if (error.message.includes("Email not confirmed")) {
        throw new EmailNotVerifiedError(normalizedEmail);
      }
      throw error;
    }

    return data;
  }

  async requestEmailOtp(
    email: string,
    shouldCreateUser: boolean,
  ): Promise<{ user: User | null; session: Session | null }> {
    const normalizedEmail = normalizeEmail(email);
    const { data, error } = await this.client.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser,
      },
    });

    if (error) throw error;
    return data;
  }

  async verifyEmailOtp(
    email: string,
    token: string,
  ): Promise<{ user: User | null; session: Session | null }> {
    const normalizedEmail = normalizeEmail(email);
    const { data, error } = await this.client.auth.verifyOtp({
      email: normalizedEmail,
      token,
      type: "email",
    });

    if (error) {
      if (isTokenExpiredOrInvalidError(error)) {
        throw new AuthOtpInvalidOrExpiredError("email");
      }
      throw error;
    }
    return data;
  }

  async signInWithOtp(
    email: string,
    redirectTo: string,
  ): Promise<{ user: User | null; session: Session | null }> {
    const normalizedEmail = normalizeEmail(email);
    const { data, error } = await this.client.auth.signInWithOtp({
      email: normalizedEmail,
      options: { shouldCreateUser: true, emailRedirectTo: redirectTo },
    });

    if (error) throw error;
    return data;
  }

  async signInWithGoogleOAuth(redirectTo: string): Promise<{ url: string }> {
    const { data, error } = await this.client.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    if (error) throw error;
    if (!data.url) {
      throw new AuthOAuthStartFailedError("google");
    }

    return { url: data.url };
  }

  async signUp(
    email: string,
    password: string,
    redirectTo: string,
  ): Promise<{ user: User | null; session: Session | null }> {
    const normalizedEmail = normalizeEmail(email);
    const { data, error } = await this.client.auth.signUp({
      email: normalizedEmail,
      password,
      options: { emailRedirectTo: redirectTo },
    });

    if (error) {
      if (error.message.includes("already registered")) {
        throw new UserAlreadyExistsError(normalizedEmail);
      }
      throw error;
    }

    return data;
  }

  async signOut(): Promise<void> {
    const { error } = await this.client.auth.signOut();
    if (error) throw error;
  }

  async exchangeCodeForSession(
    code: string,
  ): Promise<{ user: User; session: Session }> {
    const { data, error } = await this.client.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return data;
  }

  async verifyMagicLink(
    tokenHash: string,
  ): Promise<{ user: User | null; session: Session | null }> {
    const { data, error } = await this.client.auth.verifyOtp({
      token_hash: tokenHash,
      type: "magiclink",
    });
    if (error) {
      if (isTokenExpiredOrInvalidError(error)) {
        throw new AuthOtpInvalidOrExpiredError("magiclink");
      }
      throw error;
    }
    return data;
  }

  async verifySignUp(
    tokenHash: string,
  ): Promise<{ user: User | null; session: Session | null }> {
    const { data, error } = await this.client.auth.verifyOtp({
      token_hash: tokenHash,
      type: "signup",
    });
    if (error) {
      if (isTokenExpiredOrInvalidError(error)) {
        throw new AuthOtpInvalidOrExpiredError("signup");
      }
      throw error;
    }
    return data;
  }

  async verifySignUpOtp(
    email: string,
    token: string,
  ): Promise<{ user: User | null; session: Session | null }> {
    const normalizedEmail = normalizeEmail(email);
    const { data, error } = await this.client.auth.verifyOtp({
      email: normalizedEmail,
      token,
      type: "signup",
    });

    if (error) {
      if (isTokenExpiredOrInvalidError(error)) {
        throw new AuthOtpInvalidOrExpiredError("signup");
      }
      throw error;
    }
    return data;
  }

  async resendSignUpOtp(email: string, redirectTo: string): Promise<void> {
    const normalizedEmail = normalizeEmail(email);
    const { error } = await this.client.auth.resend({
      type: "signup",
      email: normalizedEmail,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) throw error;
  }

  async verifyRecovery(tokenHash: string): Promise<void> {
    const { error } = await this.client.auth.verifyOtp({
      token_hash: tokenHash,
      type: "recovery",
    });
    if (error) {
      if (isTokenExpiredOrInvalidError(error)) {
        throw new AuthOtpInvalidOrExpiredError("recovery");
      }
      throw error;
    }
  }
}
