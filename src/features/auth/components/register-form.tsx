"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
import { type RegisterDTO, RegisterSchema } from "@/lib/modules/auth/dtos";
import {
  useMutAuthLoginWithGoogle,
  useMutAuthRegister,
  useMutAuthResendSignUpOtp,
  useMutAuthVerifySignUpOtp,
} from "../hooks";
import { EmailVerificationScreen } from "./email-verification-screen";
import { GoogleSignInButton } from "./google-sign-in-button";

export interface RegisterFormProps {
  title?: string;
  description?: string;
  defaultRedirect?: string;
  redirectParam?: string | null;
}

export function RegisterForm({
  title = "Create Account",
  description = "Enter your details to create an account",
  defaultRedirect = appRoutes.postLogin.base,
  redirectParam,
}: RegisterFormProps = {}) {
  const router = useRouter();
  const [success, setSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const registerMutation = useMutAuthRegister();
  const googleLoginMutation = useMutAuthLoginWithGoogle();
  const verifySignUpOtpMutation = useMutAuthVerifySignUpOtp();
  const resendSignUpOtpMutation = useMutAuthResendSignUpOtp();

  const redirectUrl = getSafeRedirectPath(redirectParam ?? null, {
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
      const result = await registerMutation.mutateAsync({
        ...data,
        redirect: redirectUrl,
      });
      setRegisteredEmail(result.user?.email ?? data.email);
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
      <EmailVerificationScreen
        email={registeredEmail}
        onVerifyOtp={async (token) => {
          try {
            await verifySignUpOtpMutation.mutateAsync({
              email: registeredEmail,
              token,
            });
            router.push(redirectUrl);
            router.refresh();
          } catch (error) {
            toast.error("Unable to verify code", {
              description: getClientErrorMessage(error, "Please try again"),
            });
          }
        }}
        onResendCode={async () => {
          await resendSignUpOtpMutation.mutateAsync({
            email: registeredEmail,
            redirect: redirectUrl,
          });
        }}
        isVerifying={verifySignUpOtpMutation.isPending}
        isResending={resendSignUpOtpMutation.isPending}
        loginHref={loginHref}
      />
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
          <GoogleSignInButton
            onClick={onGoogleLogin}
            isLoading={googleSubmitting}
          />

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
            {submitting && <Spinner />} Create Account
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
