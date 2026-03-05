"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "@/common/toast";
import { getClientErrorMessage } from "@/common/toast/errors";
import {
  StandardFormInput,
  StandardFormProvider,
  StandardFormTextarea,
} from "@/components/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  type SubmitContactMessageDTO,
  SubmitContactMessageSchema,
} from "@/lib/modules/contact/dtos";
import { useMutSubmitContactMessage } from "../hooks";

const defaultValues: SubmitContactMessageDTO = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

export function ContactUsForm() {
  const submitMutation = useMutSubmitContactMessage();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<SubmitContactMessageDTO>({
    resolver: zodResolver(SubmitContactMessageSchema),
    mode: "onBlur",
    defaultValues,
  });

  const {
    reset,
    formState: { isDirty, isValid, isSubmitting },
  } = form;

  const submitting = submitMutation.isPending || isSubmitting;
  const isSubmitDisabled = submitting || !isDirty || !isValid;

  useEffect(() => {
    if (submitted && isDirty) {
      setSubmitted(false);
    }
  }, [submitted, isDirty]);

  const onSubmit = async (data: SubmitContactMessageDTO) => {
    try {
      setSubmitted(false);
      await submitMutation.mutateAsync(data);
      reset(defaultValues);
      setSubmitted(true);
      toast.success("Message sent", {
        description: "Thanks for reaching out. We will reply soon.",
      });
    } catch (error) {
      toast.error("Unable to send message", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  return (
    <Card className="border-border/60 bg-background/90 shadow-sm backdrop-blur">
      <CardHeader className="space-y-2">
        <div>
          <h2 className="font-heading text-2xl font-semibold">
            Send a message
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Share your question, partnership request, or venue inquiry.
          </p>
        </div>
      </CardHeader>
      <StandardFormProvider form={form} onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          {submitted && (
            <Alert className="border-success/30 bg-success/10 text-success">
              <MailCheck className="h-4 w-4" />
              <AlertTitle className="text-success">Message sent</AlertTitle>
              <AlertDescription className="text-success/80">
                We will get back to you within 1-2 business days.
              </AlertDescription>
            </Alert>
          )}

          <StandardFormInput<SubmitContactMessageDTO>
            name="name"
            label="Full name"
            placeholder="Your name"
            autoComplete="name"
            required
          />
          <StandardFormInput<SubmitContactMessageDTO>
            name="email"
            label="Email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
          <StandardFormInput<SubmitContactMessageDTO>
            name="subject"
            label="Subject"
            placeholder="What can we help with?"
            required
          />
          <StandardFormTextarea<SubmitContactMessageDTO>
            name="message"
            label="Message"
            placeholder="Tell us a bit more so we can help quickly."
            required
          />
        </CardContent>

        <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Your details stay private and are only used to reply.
          </p>
          <Button type="submit" size="lg" disabled={isSubmitDisabled}>
            {submitting && <Spinner className="text-primary-foreground" />}
            Send message
          </Button>
        </CardFooter>
      </StandardFormProvider>
    </Card>
  );
}
