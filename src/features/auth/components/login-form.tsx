"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { appRoutes } from "@/common/app-routes";
import { getSafeRedirectPath } from "@/common/redirects";
import { toast } from "@/common/toast";
import { getClientErrorMessage } from "@/common/toast/errors";
import { StandardFormInput, StandardFormProvider } from "@/components/form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { type LoginDTO, LoginSchema } from "@/lib/modules/auth/dtos";
import { useMutAuthLogin, useMutAuthLoginWithGoogle } from "../hooks";
import { GoogleSignInButton } from "./google-sign-in-button";

export interface LoginFormProps {
  redirectParam?: string | null;
  authErrorParam?: string | null;
}

export function LoginForm({
  redirectParam,
  authErrorParam,
}: LoginFormProps = {}) {
  const router = useRouter();
  const loginMutation = useMutAuthLogin();
  const googleLoginMutation = useMutAuthLoginWithGoogle();

  const redirectUrl = getSafeRedirectPath(redirectParam ?? null, {
    fallback: appRoutes.postLogin.base,
    origin: typeof window !== "undefined" ? window.location.origin : undefined,
    disallowRoutes: ["guest"],
  });
  const showBookingContext = redirectUrl.includes("/schedule");
  const authError = authErrorParam ?? null;

  const authErrorMessage = (() => {
    switch (authError) {
      case "missing_token_hash":
      case "missing_type":
        return "The verification link is incomplete. Please request a new email.";
      case "unknown_type":
        return "The verification link is invalid. Please request a new email.";
      case "otp_verify_error":
        return "This verification link is invalid or expired. Please request a new email.";
      default:
        return null;
    }
  })();

  const form = useForm<LoginDTO>({
    resolver: zodResolver(LoginSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const {
    reset,
    formState: { isDirty, isValid, isSubmitting },
  } = form;

  const submitting = loginMutation.isPending || isSubmitting;
  const googleSubmitting = googleLoginMutation.isPending;
  const isSubmitDisabled = submitting || !isDirty || !isValid;

  const onSubmit = async (data: LoginDTO) => {
    try {
      await loginMutation.mutateAsync(data);
      reset(data);
      router.push(redirectUrl);
      router.refresh();
    } catch (error) {
      toast.error("Unable to sign in", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  const onGoogleLogin = async () => {
    try {
      const result = await googleLoginMutation.mutateAsync({
        redirect: redirectUrl,
      });
      window.location.assign(result.url);
    } catch (error) {
      toast.error("Unable to continue with Google", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  const registerHref =
    redirectUrl !== appRoutes.home.base
      ? `${appRoutes.register.base}?redirect=${encodeURIComponent(redirectUrl)}`
      : appRoutes.register.base;

  const magicLinkHref =
    redirectUrl !== appRoutes.home.base
      ? `${appRoutes.magicLink.base}?redirect=${encodeURIComponent(redirectUrl)}`
      : appRoutes.magicLink.base;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>Sign in with your email and password</CardDescription>
        {showBookingContext && (
          <p className="text-sm text-muted-foreground">
            You&apos;ll return to your reservation after signing in.
          </p>
        )}
        {authErrorMessage && (
          <p className="text-sm text-destructive">{authErrorMessage}</p>
        )}
      </CardHeader>
      <StandardFormProvider form={form} onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          <GoogleSignInButton
            onClick={onGoogleLogin}
            isLoading={googleSubmitting}
          />

          <div className="py-2">
            <Separator />
          </div>

          <StandardFormInput<LoginDTO>
            name="email"
            label="Email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
          />

          <StandardFormInput<LoginDTO>
            name="password"
            label="Password"
            type="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            required
          />
        </CardContent>

        <CardFooter className="mt-6 flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isSubmitDisabled}>
            {submitting && <Spinner />} Sign In
          </Button>

          <div className="text-muted-foreground text-sm">
            Don&apos;t have an account?{" "}
            <Link href={registerHref} className="text-primary hover:underline">
              Sign up
            </Link>
          </div>

          <div className="text-muted-foreground text-sm">
            <Link href={magicLinkHref} className="text-primary hover:underline">
              Sign in with email link
            </Link>
          </div>
        </CardFooter>
      </StandardFormProvider>
    </Card>
  );
}
