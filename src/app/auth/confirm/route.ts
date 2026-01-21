import type { EmailOtpType } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { logger } from "@/shared/infra/logger";
import { createClient } from "@/shared/infra/supabase/create-client";
import { appRoutes } from "@/shared/lib/app-routes";
import { getSafeRedirectPath } from "@/shared/lib/redirects";

/**
 * Auth confirm route handler for PKCE flow (magic link, signup, recovery).
 * Verifies token_hash and creates session via verifyOtp.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const redirectPath = getSafeRedirectPath(searchParams.get("redirect"), {
    fallback: appRoutes.home.base,
    origin: request.nextUrl.origin,
  });
  const redirectUrl = new URL(redirectPath, request.url);
  const fallbackUrl = new URL(appRoutes.index.base, request.url);

  if (!token_hash || !type) {
    logger.warn(
      { scope: "auth:confirm", token_hash: !!token_hash, type },
      "Missing token_hash or type parameter",
    );
    return NextResponse.redirect(fallbackUrl);
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
        logger.error(
          {
            scope: "auth:magiclink_verification",
            error: error instanceof Error ? error.message : "Unknown error",
          },
          "Magic link verification failed",
        );
      }
      break;

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
        logger.error(
          {
            scope: "auth:signup_verification",
            error: error instanceof Error ? error.message : "Unknown error",
          },
          "Signup verification failed",
        );
      }
      break;

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
        logger.error(
          {
            scope: "auth:recovery_verification",
            error: error instanceof Error ? error.message : "Unknown error",
          },
          "Password recovery verification failed",
        );
      }
      break;

    default:
      logger.warn({ scope: "auth:confirm", type }, "Unknown verification type");
  }

  // Fallback: redirect to home on error
  return NextResponse.redirect(fallbackUrl);
}
