import type { EmailOtpType } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { appRoutes } from "@/common/app-routes";
import { getSafeRedirectPath } from "@/common/redirects";
import { getRequestOrigin } from "@/common/request-origin";
import { env } from "@/lib/env";
import { logger } from "@/lib/shared/infra/logger";
import { createClient } from "@/lib/shared/infra/supabase/create-client";

/**
 * Auth confirm route handler for PKCE flow (magic link, signup, recovery).
 * Verifies token_hash and creates session via verifyOtp.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const origin = getRequestOrigin(request);
  const redirectParam =
    searchParams.get("redirect") ?? searchParams.get("next");
  const redirectPath = getSafeRedirectPath(redirectParam, {
    fallback: appRoutes.postLogin.base,
    origin,
    disallowRoutes: ["guest"],
    disallowPathname: request.nextUrl.pathname,
  });
  const redirectUrl = new URL(redirectPath, origin);

  const buildAuthErrorUrl = (reason: string) => {
    const loginUrl = new URL(appRoutes.login.from(redirectPath), origin);
    loginUrl.searchParams.set("auth_error", reason);
    return loginUrl;
  };

  if (redirectParam && redirectPath === appRoutes.postLogin.base) {
    logger.warn(
      {
        scope: "auth:confirm",
        event: "auth.confirm.redirect_sanitized",
        redirectParam,
        redirectPath,
      },
      "Unsafe or invalid redirect param sanitized to fallback",
    );
  }

  if (!token_hash || !type) {
    logger.warn(
      {
        scope: "auth:confirm",
        token_hash: !!token_hash,
        type,
        redirectPath,
        reason: !token_hash ? "missing_token_hash" : "missing_type",
      },
      "Missing token_hash or type parameter",
    );
    return NextResponse.redirect(
      buildAuthErrorUrl(!token_hash ? "missing_token_hash" : "missing_type"),
    );
  }

  const cookieStore = await cookies();
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  );

  const handleVerificationError = async (
    scope: string,
    error: unknown,
    reason = "otp_verify_error",
  ) => {
    logger.error(
      {
        scope,
        reason,
        redirectPath,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      "Auth verification failed",
    );

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        logger.warn(
          {
            scope,
            reason,
            userId: user.id,
            redirectPath,
          },
          "Auth verification failed but session exists, continuing redirect",
        );
        return NextResponse.redirect(redirectUrl);
      }
    } catch {
      // Ignore secondary session-check errors and continue fallback flow.
    }

    return NextResponse.redirect(buildAuthErrorUrl(reason));
  };

  switch (type) {
    case "magiclink":
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash,
          type: "magiclink",
        });

        if (error) throw error;

        if (data.user) {
          logger.info(
            { event: "user.magic_link_verified", userId: data.user.id },
            "Magic link verified",
          );
        }

        return NextResponse.redirect(redirectUrl);
      } catch (error) {
        return handleVerificationError("auth:magiclink_verification", error);
      }

    case "signup":
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash,
          type: "signup",
        });

        if (error) throw error;

        if (data.user) {
          logger.info(
            { event: "user.signup_verified", userId: data.user.id },
            "Signup verified",
          );
        }

        return NextResponse.redirect(redirectUrl);
      } catch (error) {
        return handleVerificationError("auth:signup_verification", error);
      }

    case "recovery":
      try {
        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type: "recovery",
        });

        if (error) throw error;

        logger.info(
          { event: "user.recovery_verified" },
          "Password recovery verified",
        );

        return NextResponse.redirect(redirectUrl);
      } catch (error) {
        return handleVerificationError("auth:recovery_verification", error);
      }

    case "invite":
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash,
          type: "invite",
        });

        if (error) throw error;

        if (data.user) {
          logger.info(
            { event: "user.invite_verified", userId: data.user.id },
            "Invite verified",
          );
        }

        return NextResponse.redirect(redirectUrl);
      } catch (error) {
        return handleVerificationError("auth:invite_verification", error);
      }

    case "email_change":
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash,
          type: "email_change",
        });

        if (error) throw error;

        if (data.user) {
          logger.info(
            { event: "user.email_change_verified", userId: data.user.id },
            "Email change verified",
          );
        }

        return NextResponse.redirect(redirectUrl);
      } catch (error) {
        return handleVerificationError("auth:email_change_verification", error);
      }

    case "email":
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash,
          type: "email",
        });

        if (error) throw error;

        if (data.user) {
          logger.info(
            { event: "user.email_otp_verified", userId: data.user.id },
            "Email OTP verified",
          );
        }

        return NextResponse.redirect(redirectUrl);
      } catch (error) {
        return handleVerificationError("auth:email_verification", error);
      }

    default:
      logger.warn({ scope: "auth:confirm", type }, "Unknown verification type");
      return NextResponse.redirect(buildAuthErrorUrl("unknown_type"));
  }
}
