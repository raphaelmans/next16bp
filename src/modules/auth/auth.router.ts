import {
  protectedProcedure,
  publicProcedure,
  router,
} from "@/shared/infra/trpc/trpc";
import {
  LoginSchema,
  MagicLinkSchema,
  RegisterSchema,
  StartGoogleOAuthSchema,
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

  loginWithMagicLink: publicProcedure
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

  register: publicProcedure
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
});
