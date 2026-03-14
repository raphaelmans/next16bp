"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "@/common/toast";
import { getClientErrorMessage } from "@/common/toast/errors";
import { StandardFormField, StandardFormProvider } from "@/components/form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import {
  type VerifyEmailOtpDTO,
  VerifyEmailOtpSchema,
} from "@/lib/modules/auth/dtos";

const RESEND_COOLDOWN_SECONDS = 60;

export interface EmailVerificationScreenProps {
  email: string;
  title?: string;
  description?: string;
  onVerifyOtp: (token: string) => Promise<void>;
  onResendCode: () => Promise<void>;
  isVerifying: boolean;
  isResending: boolean;
  loginHref: string;
}

export function EmailVerificationScreen({
  email,
  title = "Check your email",
  description,
  onVerifyOtp,
  onResendCode,
  isVerifying,
  isResending,
  loginHref,
}: EmailVerificationScreenProps) {
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  const form = useForm<VerifyEmailOtpDTO>({
    resolver: zodResolver(VerifyEmailOtpSchema),
    mode: "onChange",
    defaultValues: {
      email,
      token: "",
    },
  });

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => {
      setCooldown((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const isSubmitDisabled = isVerifying || !form.formState.isValid;
  const canResend = cooldown === 0 && !isResending;

  const onSubmit = async (data: VerifyEmailOtpDTO) => {
    await onVerifyOtp(data.token);
  };

  const handleResend = async () => {
    try {
      await onResendCode();
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      toast.error("Unable to resend code", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  const defaultDescription = `We've sent a confirmation link and a 6-digit code to ${email}`;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description ?? defaultDescription}</CardDescription>
      </CardHeader>
      <StandardFormProvider form={form} onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          <input type="hidden" {...form.register("email")} />

          <StandardFormField<VerifyEmailOtpDTO>
            name="token"
            label="Confirmation code"
            required
            className="items-center text-center"
          >
            {({ field }) => (
              <div className="flex justify-center">
                <InputOTP maxLength={6} {...field}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            )}
          </StandardFormField>

          <div className="text-muted-foreground text-sm text-center">
            {cooldown > 0
              ? `You can resend in ${cooldown}s`
              : "Didn't get a code?"}
          </div>

          <p className="text-muted-foreground text-xs text-center">
            Or check your email for a link
          </p>
        </CardContent>

        <CardFooter className="mt-6 flex flex-col gap-4">
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitDisabled}
            loading={isVerifying}
          >
            Verify
          </Button>

          <Button
            type="button"
            variant="link"
            onClick={handleResend}
            disabled={!canResend}
          >
            Resend code
          </Button>

          <Link
            href={loginHref}
            className="text-primary hover:underline text-sm"
          >
            Back to sign in
          </Link>
        </CardFooter>
      </StandardFormProvider>
    </Card>
  );
}
