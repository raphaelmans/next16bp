import {
  protectedProcedure,
  publicProcedure,
  rateLimitedProcedure,
  router,
} from "@/lib/shared/infra/trpc/trpc";
import {
  LoginSchema,
  MagicLinkSchema,
  RegisterSchema,
  RequestEmailOtpSchema,
  StartGoogleOAuthSchema,
  VerifyEmailOtpSchema,
  VerifyTokenHashSchema,
} from "./dtos";
import {
  makeAuthService,
  makeRegisterUserUseCase,
} from "./factories/auth.factory";

export const authRouter = router({
  login: publicProcedure.input(LoginSchema).mutation(async ({ input, ctx }) => {
    const authService = makeAuthService(ctx.cookies);
    const result = await authService.signIn(input.email, input.password);
    return { user: { id: result.user.id, email: result.user.email } };
  }),

  requestEmailOtp: rateLimitedProcedure("authEmailSend")
    .input(RequestEmailOtpSchema)
    .mutation(async ({ input, ctx }) => {
      const authService = makeAuthService(ctx.cookies);
      await authService.requestEmailOtpCode(input.email, true);
      return { success: true };
    }),

  verifyEmailOtp: publicProcedure
    .input(VerifyEmailOtpSchema)
    .mutation(async ({ input, ctx }) => {
      const authService = makeAuthService(ctx.cookies);
      const result = await authService.verifyEmailOtpCode(
        input.email,
        input.token,
      );
      return {
        user: result.user
          ? { id: result.user.id, email: result.user.email }
          : null,
      };
    }),

  loginWithMagicLink: rateLimitedProcedure("authEmailSend")
    .input(MagicLinkSchema)
    .mutation(async ({ input, ctx }) => {
      const authService = makeAuthService(ctx.cookies);
      await authService.signInWithMagicLink(
        input.email,
        ctx.origin,
        input.redirect,
      );
      return { success: true, message: "Magic link sent to email" };
    }),

  loginWithGoogle: publicProcedure
    .input(StartGoogleOAuthSchema)
    .mutation(async ({ input, ctx }) => {
      const authService = makeAuthService(ctx.cookies);
      const result = await authService.startGoogleOAuth(
        ctx.origin,
        input.redirect,
      );
      return { url: result.url };
    }),

  register: rateLimitedProcedure("authEmailSend")
    .input(RegisterSchema)
    .mutation(async ({ input, ctx }) => {
      const useCase = makeRegisterUserUseCase(ctx.cookies);
      const result = await useCase.execute(input, ctx.origin);
      return result;
    }),

  logout: protectedProcedure.mutation(async ({ ctx }) => {
    const authService = makeAuthService(ctx.cookies);
    await authService.signOut();
    return { success: true };
  }),

  me: protectedProcedure.query(async ({ ctx }) => {
    return {
      id: ctx.session.userId,
      email: ctx.session.email,
      role: ctx.session.role,
    };
  }),

  verifyMagicLink: publicProcedure
    .input(VerifyTokenHashSchema)
    .query(async ({ input, ctx }) => {
      const authService = makeAuthService(ctx.cookies);
      const result = await authService.verifyMagicLink(input.token_hash);
      return {
        user: result.user
          ? { id: result.user.id, email: result.user.email }
          : null,
      };
    }),

  verifySignUp: publicProcedure
    .input(VerifyTokenHashSchema)
    .query(async ({ input, ctx }) => {
      const authService = makeAuthService(ctx.cookies);
      const result = await authService.verifySignUp(input.token_hash);
      return {
        user: result.user
          ? { id: result.user.id, email: result.user.email }
          : null,
      };
    }),

  verifySignUpOtp: publicProcedure
    .input(VerifyEmailOtpSchema)
    .mutation(async ({ input, ctx }) => {
      const authService = makeAuthService(ctx.cookies);
      const result = await authService.verifySignUpOtpCode(
        input.email,
        input.token,
      );
      return {
        user: result.user
          ? { id: result.user.id, email: result.user.email }
          : null,
      };
    }),

  resendSignUpOtp: rateLimitedProcedure("authEmailSend")
    .input(RequestEmailOtpSchema)
    .mutation(async ({ input, ctx }) => {
      const authService = makeAuthService(ctx.cookies);
      await authService.resendSignUpOtpCode(
        input.email,
        ctx.origin,
        input.redirect,
      );
      return { success: true };
    }),

  verifyRecovery: publicProcedure
    .input(VerifyTokenHashSchema)
    .mutation(async ({ input, ctx }) => {
      const authService = makeAuthService(ctx.cookies);
      await authService.verifyRecovery(input.token_hash);
      return { success: true };
    }),
});
