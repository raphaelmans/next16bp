"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { MagicLinkSchema, type MagicLinkDTO } from "@/modules/auth/dtos";
import { useMagicLink } from "../hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function MagicLinkForm() {
  const [success, setSuccess] = useState(false);
  const magicLinkMutation = useMagicLink();

  const form = useForm<MagicLinkDTO>({
    resolver: zodResolver(MagicLinkSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: MagicLinkDTO) => {
    try {
      await magicLinkMutation.mutateAsync(data);
      setSuccess(true);
    } catch (error) {
      if (error instanceof Error) {
        form.setError("root", { message: error.message });
      } else {
        form.setError("root", { message: "An unexpected error occurred" });
      }
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
          <Link href="/login" className="text-primary hover:underline text-sm">
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
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {form.formState.errors.root && (
              <div className="text-destructive text-sm">
                {form.formState.errors.root.message}
              </div>
            )}

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
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full"
              disabled={magicLinkMutation.isPending}
            >
              {magicLinkMutation.isPending ? "Sending..." : "Send Magic Link"}
            </Button>

            <div className="text-muted-foreground text-sm">
              <Link href="/login" className="text-primary hover:underline">
                Sign in with password
              </Link>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
