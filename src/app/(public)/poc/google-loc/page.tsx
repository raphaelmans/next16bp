import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GoogleLocPocPage as DiscoveryGoogleLocPocPage } from "@/features/discovery/pages/google-loc-poc-page";

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
  return <DiscoveryGoogleLocPocPage />;
}
