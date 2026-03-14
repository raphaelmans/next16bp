"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { appRoutes } from "@/common/app-routes";
import { getSafeRedirectPath } from "@/common/redirects";
import { toast } from "@/common/toast";
import { getClientErrorMessage } from "@/common/toast/errors";
import {
  StandardFormField,
  StandardFormInput,
  StandardFormProvider,
} from "@/components/form";
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
  type RequestEmailOtpDTO,
  RequestEmailOtpSchema,
  type VerifyEmailOtpDTO,
  VerifyEmailOtpSchema,
} from "@/lib/modules/auth/dtos";
import { useMutAuthRequestEmailOtp, useMutAuthVerifyEmailOtp } from "../hooks";

const RESEND_COOLDOWN_SECONDS = 60;

type OtpStep = "request" | "verify";

export interface EmailOtpFormProps {
  redirectParam?: string | null;
}

export function EmailOtpForm({ redirectParam }: EmailOtpFormProps = {}) {
  const router = useRouter();
  const [step, setStep] = useState<OtpStep>("request");
  const [email, setEmail] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const requestMutation = useMutAuthRequestEmailOtp();
  const verifyMutation = useMutAuthVerifyEmailOtp();

  const redirectUrl = getSafeRedirectPath(redirectParam ?? null, {
    fallback: appRoutes.postLogin.base,
    origin: typeof window !== "undefined" ? window.location.origin : undefined,
    disallowRoutes: ["guest"],
  });

  const loginHref = appRoutes.login.from(redirectUrl);

  const requestForm = useForm<RequestEmailOtpDTO>({
    resolver: zodResolver(RequestEmailOtpSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
    },
  });

  const verifyForm = useForm<VerifyEmailOtpDTO>({
    resolver: zodResolver(VerifyEmailOtpSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
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

  useEffect(() => {
    if (step !== "verify") return;
    verifyForm.setValue("email", email, { shouldValidate: true });
  }, [step, email, verifyForm]);

  const requestSubmitting =
    requestMutation.isPending || requestForm.formState.isSubmitting;
  const verifySubmitting =
    verifyMutation.isPending || verifyForm.formState.isSubmitting;

  const onRequestSubmit = async (data: RequestEmailOtpDTO) => {
    try {
      await requestMutation.mutateAsync({
        ...data,
        redirect: redirectUrl,
      });
      setEmail(data.email);
      setStep("verify");
      setCooldown(RESEND_COOLDOWN_SECONDS);
      verifyForm.reset({ email: data.email, token: "" });
    } catch (error) {
      toast.error("Unable to send code", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  const onVerifySubmit = async (data: VerifyEmailOtpDTO) => {
    try {
      await verifyMutation.mutateAsync({
        email: data.email,
        token: data.token,
        redirect: redirectUrl,
      });
      router.push(redirectUrl);
      router.refresh();
    } catch (error) {
      toast.error("Unable to verify code", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  const onResend = async () => {
    if (!email) return;
    try {
      await requestMutation.mutateAsync({ email, redirect: redirectUrl });
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      toast.error("Unable to resend code", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  const onChangeEmail = () => {
    setStep("request");
    requestForm.reset({ email });
  };

  if (step === "verify") {
    const isSubmitDisabled = verifySubmitting || !verifyForm.formState.isValid;
    const canResend = cooldown === 0 && !requestSubmitting;

    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Enter your code</CardTitle>
          <CardDescription>
            We sent a 6-digit code to{" "}
            <span className="font-medium">{email}</span>.
          </CardDescription>
        </CardHeader>
        <StandardFormProvider form={verifyForm} onSubmit={onVerifySubmit}>
          <CardContent className="space-y-4">
            <input type="hidden" {...verifyForm.register("email")} />

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
          </CardContent>

          <CardFooter className="mt-6 flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitDisabled}
              loading={verifySubmitting}
            >
              Verify & sign in
            </Button>

            <div className="flex flex-col gap-2 text-sm text-center">
              <Button
                type="button"
                variant="link"
                onClick={onResend}
                disabled={!canResend}
              >
                Resend code
              </Button>
              <Button
                type="button"
                variant="link"
                className="text-muted-foreground"
                onClick={onChangeEmail}
              >
                Change email
              </Button>
            </div>
          </CardFooter>
        </StandardFormProvider>
      </Card>
    );
  }

  const requestDisabled =
    requestSubmitting ||
    !requestForm.formState.isDirty ||
    !requestForm.formState.isValid;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign in with a code</CardTitle>
        <CardDescription>
          Enter your email and we&apos;ll send you a 6-digit sign-in code
        </CardDescription>
      </CardHeader>
      <StandardFormProvider form={requestForm} onSubmit={onRequestSubmit}>
        <CardContent className="space-y-4">
          <StandardFormInput<RequestEmailOtpDTO>
            name="email"
            label="Email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </CardContent>

        <CardFooter className="mt-6 flex flex-col gap-4">
          <Button
            type="submit"
            className="w-full"
            disabled={requestDisabled}
            loading={requestSubmitting}
          >
            Send code
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
