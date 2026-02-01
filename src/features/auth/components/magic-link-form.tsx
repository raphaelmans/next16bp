"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { type MagicLinkDTO, MagicLinkSchema } from "@/lib/modules/auth/dtos";
import { useMagicLink, useVerifyEmailOtp } from "../hooks";
import { EmailVerificationScreen } from "./email-verification-screen";

export function MagicLinkForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [success, setSuccess] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  const magicLinkMutation = useMagicLink();
  const verifyEmailOtpMutation = useVerifyEmailOtp();
  const redirectUrl = getSafeRedirectPath(searchParams.get("redirect"), {
    fallback: appRoutes.postLogin.base,
    origin: typeof window !== "undefined" ? window.location.origin : undefined,
    disallowRoutes: ["guest"],
  });
  const loginHref = appRoutes.login.from(redirectUrl);

  const form = useForm<MagicLinkDTO>({
    resolver: zodResolver(MagicLinkSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
    },
  });

  const {
    reset,
    formState: { isDirty, isValid, isSubmitting },
  } = form;

  const submitting = magicLinkMutation.isPending || isSubmitting;
  const isSubmitDisabled = submitting || !isDirty || !isValid;

  const onSubmit = async (data: MagicLinkDTO) => {
    try {
      await magicLinkMutation.mutateAsync({
        ...data,
        redirect: redirectUrl,
      });
      setSentEmail(data.email);
      reset(data);
      setSuccess(true);
    } catch (error) {
      toast.error("Unable to send magic link", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  if (success) {
    return (
      <EmailVerificationScreen
        email={sentEmail}
        onVerifyOtp={async (token) => {
          try {
            await verifyEmailOtpMutation.mutateAsync({
              email: sentEmail,
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
          await magicLinkMutation.mutateAsync({
            email: sentEmail,
            redirect: redirectUrl,
          });
        }}
        isVerifying={verifyEmailOtpMutation.isPending}
        isResending={magicLinkMutation.isPending}
        loginHref={loginHref}
      />
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Magic Link Sign In</CardTitle>
        <CardDescription>
          Enter your email and we&apos;ll send you a link to sign in
        </CardDescription>
      </CardHeader>
      <StandardFormProvider form={form} onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          <StandardFormInput<MagicLinkDTO>
            name="email"
            label="Email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </CardContent>

        <CardFooter className="mt-6 flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isSubmitDisabled}>
            {submitting ? "Sending..." : "Send Magic Link"}
          </Button>

          <div className="text-muted-foreground text-sm">
            <Link href={loginHref} className="text-primary hover:underline">
              Sign in with password
            </Link>
          </div>
        </CardFooter>
      </StandardFormProvider>
    </Card>
  );
}
