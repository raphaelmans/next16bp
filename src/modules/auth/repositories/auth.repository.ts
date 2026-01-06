import type { SupabaseClient } from "@/shared/infra/supabase/types";
import {
  InvalidCredentialsError,
  EmailNotVerifiedError,
  UserAlreadyExistsError,
} from "../errors/auth.errors";

/**
 * AuthRepository wraps Supabase Auth client.
 * Maps Supabase errors to our domain errors.
 */
export class AuthRepository {
  constructor(private client: SupabaseClient) {}

  async getCurrentUser() {
    const {
      data: { user },
      error,
    } = await this.client.auth.getUser();
    if (error) throw error;
    return user;
  }

  async signInWithPassword(email: string, password: string) {
    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        throw new InvalidCredentialsError();
      }
      if (error.message.includes("Email not confirmed")) {
        throw new EmailNotVerifiedError(email);
      }
      throw error;
    }

    return data;
  }

  async signInWithOtp(email: string, redirectTo: string) {
    const { data, error } = await this.client.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true, emailRedirectTo: redirectTo },
    });

    if (error) throw error;
    return data;
  }

  async signUp(email: string, password: string, redirectTo: string) {
    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTo },
    });

    if (error) {
      if (error.message.includes("already registered")) {
        throw new UserAlreadyExistsError(email);
      }
      throw error;
    }

    return data;
  }

  async signOut() {
    const { error } = await this.client.auth.signOut();
    if (error) throw error;
  }

  async exchangeCodeForSession(code: string) {
    const { data, error } = await this.client.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return data;
  }
}
