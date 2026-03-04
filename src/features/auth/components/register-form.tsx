"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { appRoutes } from "@/common/app-routes";
import { getSafeRedirectPath } from "@/common/redirects";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { type RegisterDTO, RegisterSchema } from "@/modules/auth/dtos";
import { useLoginWithGoogle, useRegister } from "../hooks/use-auth";
import { GoogleSignInButton } from "./google-sign-in-button";

export interface RegisterFormProps {
  redirectParam?: string | null;
}

export function RegisterForm({ redirectParam }: RegisterFormProps = {}) {
  const [success, setSuccess] = useState(false);
  const registerMutation = useRegister();
  const googleLoginMutation = useLoginWithGoogle();

  const redirectUrl = getSafeRedirectPath(redirectParam, {
    fallback: appRoutes.postLogin.base,
    origin: typeof window !== "undefined" ? window.location.origin : undefined,
    disallowRoutes: ["guest"],
  });

  const form = useForm<RegisterDTO>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: RegisterDTO) => {
    try {
      await registerMutation.mutateAsync({
        ...data,
        redirect: redirectUrl,
      });
      setSuccess(true);
    } catch (error) {
      if (error instanceof Error) {
        form.setError("root", { message: error.message });
      } else {
        form.setError("root", { message: "An unexpected error occurred" });
      }
    }
  };

  const onGoogleLogin = async () => {
    try {
      const result = await googleLoginMutation.mutateAsync({
        redirect: redirectUrl,
      });
      window.location.assign(result.url);
    } catch (error) {
      if (error instanceof Error) {
        form.setError("root", { message: error.message });
      } else {
        form.setError("root", { message: "An unexpected error occurred" });
      }
    }
  };

  const loginHref =
    redirectUrl !== appRoutes.postLogin.base
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
        <CardTitle>Create Account</CardTitle>
        <CardDescription>
          Enter your details to create an account
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {form.formState.errors.root && (
              <div className="text-destructive text-sm">
                {form.formState.errors.root.message}
              </div>
            )}

            <GoogleSignInButton
              onClick={onGoogleLogin}
              isLoading={googleLoginMutation.isPending}
            />

            <Separator />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending
                ? "Creating account..."
                : "Create Account"}
            </Button>

            <div className="text-muted-foreground text-sm">
              Already have an account?{" "}
              <Link href={loginHref} className="text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
