import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

const appUrl = env.NEXT_PUBLIC_APP_URL ?? "https://kudoscourts.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        disallow: [
          "/api",
          "/admin",
          "/owner",
          "/dashboard",
          "/account",
          "/reservations",
          "/login",
          "/register",
          "/magic-link",
          "/auth",
          "/courts/*/schedule",
          "/venues/*/schedule",
          "/courts/*/book",
          "/venues/*/book",
        ],
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
