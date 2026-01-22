import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { IBM_Plex_Mono, Outfit, Source_Sans_3 } from "next/font/google";
import Script from "next/script";
import { Providers } from "@/components/providers";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const sourceSans = Source_Sans_3({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://kudoscourts.com";
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
      logo: `${appUrl}/apple-icon.png`,
      sameAs: [
        "https://facebook.com/kudoscourts",
        "https://instagram.com/kudoscourts",
      ],
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
  title: {
    default: "KudosCourts - Discover. Reserve. Play.",
    template: "%s | KudosCourts",
  },
  description:
    "Find pickleball and other sports courts near you and book your next game in seconds. The unified platform for players and court owners.",
  keywords: [
    "pickleball",
    "basketball courts",
    "tennis courts",
    "badminton courts",
    "court booking",
    "court reservation",
    "sports booking",
    "court discovery",
  ],
  authors: [{ name: "KudosCourts" }],
  creator: "KudosCourts",
  metadataBase: new URL(appUrl),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "KudosCourts",
    title: "KudosCourts - Discover. Reserve. Play.",
    description:
      "Find pickleball and other sports courts near you and book your next game in seconds. The unified platform for players and court owners.",
  },
  twitter: {
    card: "summary_large_image",
    title: "KudosCourts - Discover. Reserve. Play.",
    description:
      "Find pickleball and other sports courts near you and book your next game in seconds.",
    creator: "@kudoscourts",
    site: "@kudoscourts",
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
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
          {JSON.stringify(structuredData)}
        </Script>
      </head>
      <body
        className={`${outfit.variable} ${sourceSans.variable} ${ibmPlexMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
