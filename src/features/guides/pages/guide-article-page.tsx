import Link from "next/link";
import Script from "next/script";
import { appRoutes } from "@/common/app-routes";
import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import type { GuideEntry } from "@/features/guides/content/guides";
import { buildCanonicalUrl } from "@/lib/shared/utils/canonical-origin";

type GuideArticlePageProps = {
  guide: GuideEntry;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function renderParagraphs(paragraphs: string[]) {
  return paragraphs.map((paragraph) => (
    <p key={paragraph} className="text-sm leading-7 text-muted-foreground">
      {paragraph}
    </p>
  ));
}

export function GuideArticlePage({ guide }: GuideArticlePageProps) {
  const canonicalUrl = buildCanonicalUrl(appRoutes.guides.detail(guide.slug));
  const structuredData = {
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
        author: {
          "@type": "Organization",
          name: "KudosCourts",
        },
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
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
    ],
  } as const;

  return (
    <>
      <Script id={`guide-article-${guide.slug}`} type="application/ld+json">
        {JSON.stringify(structuredData).replace(/</g, "\\u003c")}
      </Script>
      <Container className="py-12 md:py-16">
        <article className="mx-auto max-w-3xl space-y-10">
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

          <div className="space-y-8">
            {guide.sections.map((section) => (
              <section key={section.title} className="space-y-3">
                <h2 className="font-heading text-2xl font-semibold tracking-tight">
                  {section.title}
                </h2>
                {renderParagraphs(section.paragraphs)}
              </section>
            ))}
          </div>

          <section className="space-y-4">
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
          </section>

          <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-6">
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
          </section>
        </article>
      </Container>
    </>
  );
}
