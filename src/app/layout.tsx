import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { HealthCheck } from "@/components/health-check";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Next16 Supabase Auth Boilerplate",
  description:
    "Auth-ready Next.js boilerplate with Supabase + Drizzle route guards and profile module.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
          <HealthCheck />
        </Providers>
      </body>
    </html>
  );
}
