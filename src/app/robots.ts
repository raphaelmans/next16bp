import type { MetadataRoute } from "next";
import { getCanonicalOrigin } from "@/lib/shared/utils/canonical-origin";

const appUrl = getCanonicalOrigin();
const isProduction =
  process.env.VERCEL_ENV === "production" ||
  process.env.NODE_ENV === "production";
const privatePaths = [
  "/api",
  "/admin",
  "/organization",
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
] satisfies string[];

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
        userAgent: ["GPTBot", "ClaudeBot", "Google-Extended"],
        disallow: "/",
      },
      {
        userAgent: "*",
        disallow: privatePaths,
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
