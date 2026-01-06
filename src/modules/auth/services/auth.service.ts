import type { AuthRepository } from "../repositories/auth.repository";

/**
 * AuthService provides business logic around authentication.
 * Thin layer that adds redirect URL construction.
 */
export class AuthService {
  constructor(private authRepository: AuthRepository) {}

  async getCurrentUser() {
    return this.authRepository.getCurrentUser();
  }

  async signIn(email: string, password: string) {
    return this.authRepository.signInWithPassword(email, password);
  }

  async signInWithMagicLink(email: string, baseUrl: string) {
    const redirectTo = `${baseUrl}/auth/callback`;
    return this.authRepository.signInWithOtp(email, redirectTo);
  }

  async signUp(email: string, password: string, baseUrl: string) {
    const redirectTo = `${baseUrl}/auth/callback`;
    return this.authRepository.signUp(email, password, redirectTo);
  }

  async signOut() {
    return this.authRepository.signOut();
  }

  async exchangeCodeForSession(code: string) {
    return this.authRepository.exchangeCodeForSession(code);
  }
}
