import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GoogleLocPocPageClient from "./page-client";

export const metadata: Metadata = {
  title: "Google Maps URL Preview (PoC)",
  description:
    "Internal proof of concept for resolving Google Maps URLs and embed previews.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function GoogleLocPocPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  return <GoogleLocPocPageClient />;
}
