import type { Metadata } from "next";

/**
 * Default OG image metadata that all pages should spread into their
 * `openGraph` and `twitter` metadata objects.
 *
 * Next.js metadata uses shallow merge — when a child page specifies
 * `openGraph`, it completely replaces the parent layout's `openGraph`
 * including images. These defaults ensure every page gets the root OG image
 * unless it provides its own images.
 */

export const DEFAULT_OG_IMAGES: NonNullable<
  NonNullable<Metadata["openGraph"]>
>["images"] = [
  {
    url: "/opengraph-image",
    width: 1200,
    height: 630,
    alt: "KudosCourts — Discover sports courts across the Philippines",
  },
];

export const DEFAULT_TWITTER_IMAGE: NonNullable<Metadata["twitter"]>["images"] =
  [
    {
      url: "/twitter-image",
      width: 1200,
      height: 630,
      alt: "KudosCourts — Discover sports courts across the Philippines",
    },
  ];
