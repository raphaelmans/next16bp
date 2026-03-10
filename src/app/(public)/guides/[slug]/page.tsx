import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Script from "next/script";
import { appRoutes } from "@/common/app-routes";
import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { DeveloperGuideArticlePage } from "@/features/guides/components/developer-guide-article-page";
import { OrgGuideArticlePage } from "@/features/guides/components/org-guide-article-page";
import { PlayerBookingGuideArticlePage } from "@/features/guides/components/player-booking-guide-article-page";
import type { GuideEntry } from "@/features/guides/content/guides";
import {
  DEVELOPER_GUIDE_SLUG,
  GUIDE_ENTRIES,
  getGuideBySlug,
  ORG_GUIDE_SLUG,
  PLAYER_BOOKING_GUIDE_SLUG,
} from "@/features/guides/content/guides";
import { GuideArticlePage } from "@/features/guides/pages/guide-article-page";
import {
  buildCanonicalUrl,
  getCanonicalOrigin,
} from "@/lib/shared/utils/canonical-origin";

type GuidePageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDE_ENTRIES.map((guide) => ({
    slug: guide.slug,
  }));
}

export async function generateMetadata({
  params,
}: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide) {
    return {
      title: "Guide",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const appUrl = getCanonicalOrigin();
  const canonicalUrl = new URL(appRoutes.guides.detail(guide.slug), appUrl);

  return {
    title: guide.title,
    description: guide.description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "article",
      title: guide.title,
      description: guide.description,
      url: canonicalUrl,
      publishedTime: guide.publishedAt,
      modifiedTime: guide.updatedAt,
    },
    twitter: {
      title: guide.title,
      description: guide.description,
    },
  };
}

// ---------------------------------------------------------------------------
// Shared helpers for the org guide wrapper (server component)
// ---------------------------------------------------------------------------

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function buildStructuredData(guide: GuideEntry) {
  const canonicalUrl = buildCanonicalUrl(appRoutes.guides.detail(guide.slug));
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: guide.title,
        description: guide.description,
        datePublished: guide.publishedAt,
        dateModified: guide.updatedAt,
        inLanguage: "en-PH",
        mainEntityOfPage: canonicalUrl,
        author: { "@type": "Organization", name: "KudosCourts" },
        publisher: {
          "@type": "Organization",
          name: "KudosCourts",
          logo: {
            "@type": "ImageObject",
            url: buildCanonicalUrl("/logo.png"),
          },
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: buildCanonicalUrl(appRoutes.index.base),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Guides",
            item: buildCanonicalUrl(appRoutes.guides.base),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: guide.title,
            item: canonicalUrl,
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: guide.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      },
    ],
  } as const;
}

function InteractiveGuideWrapper({
  guide,
  article,
}: {
  guide: GuideEntry;
  article: React.ReactNode;
}) {
  const structuredData = buildStructuredData(guide);

  return (
    <>
      <Script id={`guide-article-${guide.slug}`} type="application/ld+json">
        {JSON.stringify(structuredData).replace(/</g, "\\u003c")}
      </Script>
      <Container className="py-12 md:py-16">
        <article className="mx-auto max-w-5xl">{article}</article>
      </Container>
    </>
  );
}

function buildInteractiveGuideChrome(
  guide: GuideEntry,
  article: React.ComponentType<{
    header?: React.ReactNode;
    footer?: React.ReactNode;
  }>,
) {
  const Article = article;

  return (
    <Article
      header={
        <header className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <Badge
              variant={guide.audience === "players" ? "secondary" : "default"}
            >
              {guide.heroEyebrow}
            </Badge>
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Query cluster: {guide.queryCluster}
            </span>
          </div>
          <div className="space-y-3">
            <h1 className="font-heading text-4xl font-bold tracking-tight md:text-5xl">
              {guide.title}
            </h1>
            <p className="text-base leading-7 text-muted-foreground md:text-lg">
              {guide.description}
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>Published {formatDate(guide.publishedAt)}</span>
            <span>Updated {formatDate(guide.updatedAt)}</span>
          </div>
          <div className="rounded-2xl border border-primary/15 bg-primary/5 p-5">
            <p className="font-heading text-sm font-semibold text-foreground">
              Direct answer
            </p>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              {guide.intro}
            </p>
          </div>
        </header>
      }
      footer={
        <>
          <div className="space-y-4">
            <h2 className="font-heading text-2xl font-semibold tracking-tight">
              Frequently asked questions
            </h2>
            <div className="space-y-4">
              {guide.faqs.map((faq) => (
                <div
                  key={faq.question}
                  className="rounded-2xl border border-border/60 bg-card p-5"
                >
                  <h3 className="font-heading text-lg font-semibold tracking-tight">
                    {faq.question}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-border/60 bg-card p-6">
            <h2 className="font-heading text-2xl font-semibold tracking-tight">
              Keep exploring
            </h2>
            <ul className="space-y-3">
              {guide.relatedLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm font-medium text-primary hover:text-primary/80"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </>
      }
    />
  );
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide) {
    return notFound();
  }

  if (slug === ORG_GUIDE_SLUG) {
    return (
      <InteractiveGuideWrapper
        guide={guide}
        article={buildInteractiveGuideChrome(guide, OrgGuideArticlePage)}
      />
    );
  }

  if (slug === PLAYER_BOOKING_GUIDE_SLUG) {
    return (
      <InteractiveGuideWrapper
        guide={guide}
        article={buildInteractiveGuideChrome(
          guide,
          PlayerBookingGuideArticlePage,
        )}
      />
    );
  }

  if (slug === DEVELOPER_GUIDE_SLUG) {
    return (
      <InteractiveGuideWrapper
        guide={guide}
        article={buildInteractiveGuideChrome(guide, DeveloperGuideArticlePage)}
      />
    );
  }

  return <GuideArticlePage guide={guide} />;
}
