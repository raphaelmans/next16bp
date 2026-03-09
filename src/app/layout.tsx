import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { IBM_Plex_Mono, Outfit, Source_Sans_3 } from "next/font/google";
import Script from "next/script";
import { getCanonicalOrigin } from "@/lib/shared/utils/canonical-origin";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

const sourceSans = Source_Sans_3({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const appUrl = getCanonicalOrigin();
const isProduction =
  process.env.VERCEL_ENV === "production" ||
  process.env.NODE_ENV === "production";
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${appUrl}/#organization`,
      name: "KudosCourts",
      url: appUrl,
      logo: `${appUrl}/logo.png`,
      sameAs: [
        "https://facebook.com/kudoscourts",
        "https://instagram.com/kudoscourts",
      ],
      areaServed: {
        "@type": "Country",
        name: "Philippines",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${appUrl}/#website`,
      url: appUrl,
      name: "KudosCourts",
      publisher: {
        "@id": `${appUrl}/#organization`,
      },
      potentialAction: {
        "@type": "SearchAction",
        target: `${appUrl}/courts?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export const metadata: Metadata = {
  manifest: "/manifest.webmanifest",
  title: {
    default: "Discover Sports Courts in the Philippines | KudosCourts",
    template: "%s | KudosCourts",
  },
  description:
    "Find sports courts across the Philippines by city, sport, reviews, amenities, and availability signals. KudosCourts is the player-first discovery platform for finding your next game.",
  keywords: [
    "pickleball",
    "pickleball courts Philippines",
    "basketball courts",
    "basketball courts Philippines",
    "tennis courts Philippines",
    "badminton courts",
    "badminton courts Philippines",
    "free reservation system",
    "sports venue listing Philippines",
    "sports courts Philippines",
    "find courts Philippines",
    "court finder Philippines",
    "player reviews sports courts",
    "availability sports courts",
    "Manila",
    "Cebu",
    "Davao",
  ],
  other: {
    "geo.region": "PH",
    "geo.placename": "Philippines",
  },
  authors: [{ name: "KudosCourts" }],
  creator: "KudosCourts",
  metadataBase: new URL(appUrl),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "KudosCourts",
    title: "Discover Sports Courts in the Philippines | KudosCourts",
    description:
      "Find sports courts across the Philippines by city, sport, reviews, amenities, and availability signals.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "One platform for every sports court in the Philippines. Search by city, sport, reviews, and amenities.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Discover Sports Courts in the Philippines | KudosCourts",
    description:
      "Find sports courts across the Philippines by city, sport, reviews, amenities, and availability signals.",
    creator: "@kudoscourts",
    site: "@kudoscourts",
    images: [
      {
        url: "/twitter-image",
        width: 1200,
        height: 630,
        alt: "One platform for every sports court in the Philippines.",
      },
    ],
  },
  robots: isProduction
    ? {
        index: true,
        follow: true,
      }
    : {
        index: false,
        follow: false,
      },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "KudosCourts",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        {process.env.NODE_ENV === "development" && (
          <>
            <Script
              crossOrigin="anonymous"
              src="//unpkg.com/react-scan/dist/auto.global.js"
              strategy="lazyOnload"
            />
            <Script
              src="//unpkg.com/react-grab/dist/index.global.js"
              crossOrigin="anonymous"
              strategy="lazyOnload"
            />
          </>
        )}
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/@react-grab/opencode/dist/client.global.js"
            strategy="lazyOnload"
          />
        )}
        <Script
          id="kudoscourts-structured-data"
          type="application/ld+json"
          strategy="beforeInteractive"
        >
          {JSON.stringify(structuredData).replace(/</g, "\\u003c")}
        </Script>
      </head>
      <body
        className={`${outfit.variable} ${sourceSans.variable} ${ibmPlexMono.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
