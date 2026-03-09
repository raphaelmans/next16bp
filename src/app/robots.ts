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
  "/courts/*/book",
  "/venues/*/book",
  "/places/*/book",
  "/poc",
  "/poc/*",
] satisfies string[];
const sitemapUrls: string[] = [
  `${appUrl}/sitemap.xml`,
  `${appUrl}/sitemaps/static`,
  `${appUrl}/sitemaps/editorial`,
  `${appUrl}/sitemaps/locations`,
  `${appUrl}/sitemaps/venues`,
  `${appUrl}/sitemaps/organizations`,
] as const;

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
        userAgent: [
          "OAI-SearchBot",
          "ChatGPT-User",
          "Claude-SearchBot",
          "PerplexityBot",
          "Bingbot",
        ],
        allow: "/",
        disallow: privatePaths,
      },
      {
        userAgent: "*",
        disallow: privatePaths,
      },
    ],
    sitemap: sitemapUrls,
  };
}
