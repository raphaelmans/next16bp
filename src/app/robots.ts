import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

const appUrl = env.NEXT_PUBLIC_APP_URL ?? "https://kudoscourts.com";
const isProduction =
  process.env.VERCEL_ENV === "production" ||
  process.env.NODE_ENV === "production";

export default function robots(): MetadataRoute.Robots {
  if (!isProduction) {
    return {
      rules: [
        {
          userAgent: "*",
          disallow: "/",
        },
      ],
    };
  }

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
          "/places/*/schedule",
          "/courts/*/book",
          "/venues/*/book",
          "/places/*/book",
          "/poc",
          "/poc/*",
        ],
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
