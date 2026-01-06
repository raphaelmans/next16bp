import { LoginForm } from "@/features/auth";

export const metadata = {
  title: "Sign In",
  description: "Sign in to your account",
};

export default function LoginPage() {
  return <LoginForm />;
}
