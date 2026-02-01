import { EmailOtpForm } from "@/features/auth";

export const metadata = {
  title: "Email Code Sign In",
  description: "Sign in with a one-time code",
};

export default function OtpPage() {
  return <EmailOtpForm />;
}
