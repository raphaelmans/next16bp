"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
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
import { type RegisterDTO, RegisterSchema } from "@/lib/modules/auth/dtos";
import { useLoginWithGoogle, useRegister } from "../hooks";

export interface RegisterFormProps {
  title?: string;
  description?: string;
  defaultRedirect?: string;
}

export function RegisterForm({
  title = "Create Account",
  description = "Enter your details to create an account",
  defaultRedirect = appRoutes.postLogin.base,
}: RegisterFormProps = {}) {
  const searchParams = useSearchParams();
  const [success, setSuccess] = useState(false);
  const registerMutation = useRegister();
  const googleLoginMutation = useLoginWithGoogle();

  const redirectUrl = getSafeRedirectPath(searchParams.get("redirect"), {
    fallback: defaultRedirect,
    origin: typeof window !== "undefined" ? window.location.origin : undefined,
    disallowRoutes: ["guest"],
  });
  const showBookingContext = redirectUrl.includes("/schedule");

  const form = useForm<RegisterDTO>({
    resolver: zodResolver(RegisterSchema),
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

  const submitting = registerMutation.isPending || isSubmitting;
  const googleSubmitting = googleLoginMutation.isPending;
  const isSubmitDisabled = submitting || !isDirty || !isValid;

  const onSubmit = async (data: RegisterDTO) => {
    try {
      await registerMutation.mutateAsync({
        ...data,
        redirect: redirectUrl,
      });
      reset(data);
      setSuccess(true);
    } catch (error) {
      toast.error("Unable to create account", {
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

  const loginHref =
    redirectUrl !== appRoutes.courts.base
      ? `${appRoutes.login.base}?redirect=${encodeURIComponent(redirectUrl)}`
      : appRoutes.login.base;

  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            We&apos;ve sent a confirmation link to your email address. Please
            click the link to verify your account.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link
            href={loginHref}
            className="text-primary hover:underline text-sm"
          >
            Back to sign in
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
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

          <StandardFormInput<RegisterDTO>
            name="email"
            label="Email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
          />

          <StandardFormInput<RegisterDTO>
            name="password"
            label="Password"
            type="password"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            required
          />
        </CardContent>

        <CardFooter className="mt-6 flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isSubmitDisabled}>
            {submitting ? "Creating account..." : "Create Account"}
          </Button>

          <div className="text-muted-foreground text-sm">
            Already have an account?{" "}
            <Link href={loginHref} className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </StandardFormProvider>
    </Card>
  );
}
