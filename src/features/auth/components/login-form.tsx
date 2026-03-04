"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { type LoginDTO, LoginSchema } from "@/modules/auth/dtos";
import { useLogin, useLoginWithGoogle } from "../hooks/use-auth";
import { GoogleSignInButton } from "./google-sign-in-button";

export interface LoginFormProps {
  redirectParam?: string | null;
}

export function LoginForm({ redirectParam }: LoginFormProps = {}) {
  const router = useRouter();
  const loginMutation = useLogin();
  const googleLoginMutation = useLoginWithGoogle();

  const redirectUrl = getSafeRedirectPath(redirectParam, {
    fallback: appRoutes.postLogin.base,
    origin: typeof window !== "undefined" ? window.location.origin : undefined,
    disallowRoutes: ["guest"],
  });

  const form = useForm<LoginDTO>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginDTO) => {
    try {
      await loginMutation.mutateAsync(data);
      router.push(redirectUrl);
      router.refresh();
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

  const registerHref =
    redirectUrl !== appRoutes.postLogin.base
      ? `${appRoutes.register.base}?redirect=${encodeURIComponent(redirectUrl)}`
      : appRoutes.register.base;

  const magicLinkHref =
    redirectUrl !== appRoutes.postLogin.base
      ? `${appRoutes.magicLink.base}?redirect=${encodeURIComponent(redirectUrl)}`
      : appRoutes.magicLink.base;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
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
                      placeholder="Enter your password"
                      autoComplete="current-password"
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
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Signing in..." : "Sign In"}
            </Button>

            <div className="text-muted-foreground text-sm">
              Don&apos;t have an account?{" "}
              <Link
                href={registerHref}
                className="text-primary hover:underline"
              >
                Sign up
              </Link>
            </div>

            <div className="text-muted-foreground text-sm">
              <Link
                href={magicLinkHref}
                className="text-primary hover:underline"
              >
                Sign in with magic link
              </Link>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
