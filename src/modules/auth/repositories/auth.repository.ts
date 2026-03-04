import type { Session, User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@/shared/infra/supabase/types";
import {
  AuthOAuthStartFailedError,
  EmailNotVerifiedError,
  InvalidCredentialsError,
  UserAlreadyExistsError,
} from "../errors/auth.errors";

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
}

/**
 * AuthRepository wraps Supabase Auth client.
 * Maps Supabase errors to our domain errors.
 */
export class AuthRepository implements IAuthRepository {
  constructor(private client: SupabaseClient) {}

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

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
    const normalizedEmail = this.normalizeEmail(email);
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

  async signInWithOtp(
    email: string,
    redirectTo: string,
  ): Promise<{ user: User | null; session: Session | null }> {
    const normalizedEmail = this.normalizeEmail(email);
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
      options: { redirectTo },
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
    const normalizedEmail = this.normalizeEmail(email);
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
}
