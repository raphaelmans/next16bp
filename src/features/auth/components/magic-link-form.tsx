"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
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
import { type MagicLinkDTO, MagicLinkSchema } from "@/modules/auth/dtos";
import { appRoutes } from "@/shared/lib/app-routes";
import { getSafeRedirectPath } from "@/shared/lib/redirects";
import { getClientErrorMessage } from "@/shared/lib/toast-errors";
import { useMagicLink } from "../hooks/use-auth";

export function MagicLinkForm() {
  const searchParams = useSearchParams();
  const [success, setSuccess] = useState(false);
  const magicLinkMutation = useMagicLink();
  const redirectUrl = getSafeRedirectPath(searchParams.get("redirect"), {
    fallback: appRoutes.home.base,
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
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            We&apos;ve sent a magic link to your email address. Click the link
            to sign in.
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
