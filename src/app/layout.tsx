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

export const metadata: Metadata = {
  title: {
    default: "KudosCourts - Discover. Reserve. Play.",
    template: "%s | KudosCourts",
  },
  description:
    "Find pickleball courts near you and book your next game in seconds. The unified platform for players and court owners.",
  keywords: [
    "pickleball",
    "court booking",
    "court reservation",
    "pickleball courts",
    "sports booking",
    "court discovery",
  ],
  authors: [{ name: "KudosCourts" }],
  creator: "KudosCourts",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://kudoscourts.com",
  ),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "KudosCourts",
    title: "KudosCourts - Discover. Reserve. Play.",
    description:
      "Find pickleball courts near you and book your next game in seconds. The unified platform for players and court owners.",
  },
  twitter: {
    card: "summary_large_image",
    title: "KudosCourts - Discover. Reserve. Play.",
    description:
      "Find pickleball courts near you and book your next game in seconds.",
    creator: "@kudoscourts",
    site: "@kudoscourts",
  },
  robots: {
    index: true,
    follow: true,
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
      </head>
      <body
        className={`${outfit.variable} ${sourceSans.variable} ${ibmPlexMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
