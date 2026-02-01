"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { appRoutes } from "@/common/app-routes";
import { getClientErrorMessage } from "@/common/hooks/toast-errors";
import { getSafeRedirectPath } from "@/common/redirects";
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
import { useLogin, useLoginWithGoogle } from "../hooks";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const loginMutation = useLogin();
  const googleLoginMutation = useLoginWithGoogle();

  const redirectUrl = getSafeRedirectPath(searchParams.get("redirect"), {
    fallback: appRoutes.postLogin.base,
    origin: typeof window !== "undefined" ? window.location.origin : undefined,
    disallowRoutes: ["guest"],
  });
  const showBookingContext = redirectUrl.includes("/schedule");

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

  const otpHref =
    redirectUrl !== appRoutes.home.base
      ? `${appRoutes.otp.base}?redirect=${encodeURIComponent(redirectUrl)}`
      : appRoutes.otp.base;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>
        {showBookingContext && (
          <p className="text-sm text-muted-foreground">
            You&apos;ll return to your reservation after signing in.
          </p>
        )}
      </CardHeader>
      <StandardFormProvider form={form} onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={googleSubmitting}
            onClick={onGoogleLogin}
          >
            {googleSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner className="text-muted-foreground" />
                Redirecting...
              </span>
            ) : (
              "Continue with Google"
            )}
          </Button>

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
            {submitting ? "Signing in..." : "Sign In"}
          </Button>

          <div className="text-muted-foreground text-sm">
            Don&apos;t have an account?{" "}
            <Link href={registerHref} className="text-primary hover:underline">
              Sign up
            </Link>
          </div>

          <div className="text-muted-foreground text-sm">
            <Link href={otpHref} className="text-primary hover:underline">
              Sign in with email code
            </Link>
          </div>

          <div className="text-muted-foreground text-sm">
            <Link href={magicLinkHref} className="text-primary hover:underline">
              Use magic link instead
            </Link>
          </div>
        </CardFooter>
      </StandardFormProvider>
    </Card>
  );
}
