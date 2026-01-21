"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
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
import { type LoginDTO, LoginSchema } from "@/modules/auth/dtos";
import { appRoutes } from "@/shared/lib/app-routes";
import { getClientErrorMessage } from "@/shared/lib/toast-errors";
import { useLogin, useLoginWithGoogle } from "../hooks/use-auth";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const loginMutation = useLogin();
  const googleLoginMutation = useLoginWithGoogle();

  const redirectUrl = searchParams.get("redirect") || appRoutes.home.base;
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
            <Link href={magicLinkHref} className="text-primary hover:underline">
              Sign in with magic link
            </Link>
          </div>
        </CardFooter>
      </StandardFormProvider>
    </Card>
  );
}
