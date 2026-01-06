import { MagicLinkForm } from "@/features/auth";

export const metadata = {
  title: "Magic Link Sign In",
  description: "Sign in with a magic link",
};

export default function MagicLinkPage() {
  return <MagicLinkForm />;
}
