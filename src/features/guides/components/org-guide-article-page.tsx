"use client";

import { Lightbulb, List } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ORG_GUIDE_SECTIONS,
  type OrgGuideSection,
  type OrgGuideSubsection,
} from "@/features/guides/components/org-guide-content";
import { getSnippetForSection } from "@/features/guides/components/org-guide-snippets";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// TOC
// ---------------------------------------------------------------------------
type TocEntry = {
  id: string;
  label: string;
  isSubsection: boolean;
  isOptional?: boolean;
};

function buildTocEntries(sections: OrgGuideSection[]): TocEntry[] {
  const entries: TocEntry[] = [];
  for (const s of sections) {
    entries.push({
      id: s.id,
      label: `${s.stepNumber}. ${s.title}`,
      isSubsection: false,
      isOptional: s.isOptional,
    });
    if (s.subsections) {
      for (const sub of s.subsections) {
        entries.push({
          id: sub.id,
          label: sub.title,
          isSubsection: true,
        });
      }
    }
  }
  return entries;
}

function TableOfContents({
  sections,
  activeId,
}: {
  sections: OrgGuideSection[];
  activeId: string;
}) {
  const entries = buildTocEntries(sections);
  return (
    <nav aria-label="Table of contents" className="space-y-1">
      {entries.map((entry) => (
        <a
          key={entry.id}
          href={`#${entry.id}`}
          className={cn(
            "block border-l-2 py-1.5 text-sm transition-colors",
            entry.isSubsection ? "pl-6 text-xs" : "pl-3",
            activeId === entry.id
              ? "border-primary font-semibold text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {entry.label}
          {entry.isOptional ? (
            <span className="ml-1.5 text-[10px] italic text-muted-foreground/60">
              optional
            </span>
          ) : null}
        </a>
      ))}
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Subsection renderer
// ---------------------------------------------------------------------------
function GuideSubsection({ subsection }: { subsection: OrgGuideSubsection }) {
  const Snippet = getSnippetForSection(subsection.id);

  return (
    <div id={subsection.id} className="scroll-mt-24 space-y-5 pt-2">
      <h3 className="font-heading text-xl font-semibold tracking-tight">
        {subsection.title}
      </h3>

      {subsection.paragraphs.map((p) => (
        <p key={p} className="text-sm leading-7 text-muted-foreground">
          {p}
        </p>
      ))}

      {Snippet ? <Snippet /> : null}

      {subsection.tip ? (
        <div className="rounded-xl border border-primary/15 bg-primary/5 p-4">
          <div className="flex items-start gap-2.5">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="text-sm leading-6 text-foreground">
              <span className="font-semibold">Tip: </span>
              {subsection.tip.text}
            </p>
          </div>
        </div>
      ) : null}

      {subsection.callout ? (
        <div className="border-l-2 border-primary/40 bg-muted/40 py-3 pl-4 pr-3 rounded-r-lg">
          <p className="text-sm leading-6 text-muted-foreground">
            {subsection.callout.text}
          </p>
        </div>
      ) : null}

      {subsection.accordionItems && subsection.accordionItems.length > 0 ? (
        <Accordion type="multiple" className="w-full">
          {subsection.accordionItems.map((item) => (
            <AccordionItem key={item.trigger} value={item.trigger}>
              <AccordionTrigger className="text-sm font-medium">
                {item.trigger}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                {item.content}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section renderer
// ---------------------------------------------------------------------------
function GuideSection({ section }: { section: OrgGuideSection }) {
  const Icon = section.icon;
  const Snippet = getSnippetForSection(section.id);

  return (
    <section id={section.id} className="scroll-mt-24 space-y-5">
      {/* Step header */}
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
            section.isOptional
              ? "border-2 border-dashed border-muted-foreground/40 text-muted-foreground"
              : "bg-primary text-primary-foreground",
          )}
        >
          {section.stepNumber}
        </span>
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            section.isOptional
              ? "bg-muted text-muted-foreground"
              : "bg-primary/10 text-primary",
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <h2 className="font-heading text-2xl font-semibold tracking-tight">
          {section.title}
        </h2>
        {section.isOptional ? (
          <span className="rounded-full border border-dashed border-muted-foreground/40 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            Optional
          </span>
        ) : null}
      </div>

      {/* Paragraphs */}
      {section.paragraphs.map((p) => (
        <p key={p} className="text-sm leading-7 text-muted-foreground">
          {p}
        </p>
      ))}

      {/* Mock UI snippet */}
      {Snippet ? <Snippet /> : null}

      {/* Tip box */}
      {section.tip ? (
        <div className="rounded-xl border border-primary/15 bg-primary/5 p-4">
          <div className="flex items-start gap-2.5">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="text-sm leading-6 text-foreground">
              <span className="font-semibold">Tip: </span>
              {section.tip.text}
            </p>
          </div>
        </div>
      ) : null}

      {/* Callout box */}
      {section.callout ? (
        <div className="border-l-2 border-primary/40 bg-muted/40 py-3 pl-4 pr-3 rounded-r-lg">
          <p className="text-sm leading-6 text-muted-foreground">
            {section.callout.text}
          </p>
        </div>
      ) : null}

      {/* Accordion */}
      {section.accordionItems && section.accordionItems.length > 0 ? (
        <Accordion type="multiple" className="w-full">
          {section.accordionItems.map((item) => (
            <AccordionItem key={item.trigger} value={item.trigger}>
              <AccordionTrigger className="text-sm font-medium">
                {item.trigger}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                {item.content}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : null}

      {/* Subsections */}
      {section.subsections?.map((sub) => (
        <GuideSubsection key={sub.id} subsection={sub} />
      ))}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------
export function OrgGuideArticlePage({
  header,
  footer,
}: {
  header?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const [activeId, setActiveId] = useState(ORG_GUIDE_SECTIONS[0].id);
  const [tocOpen, setTocOpen] = useState(false);
  const sectionRefs = useRef<Map<string, IntersectionObserverEntry>>(new Map());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          sectionRefs.current.set(entry.target.id, entry);
        }

        // Find the topmost visible section
        let topId: string | null = null;
        let topY = Number.POSITIVE_INFINITY;

        for (const [id, entry] of sectionRefs.current) {
          if (entry.isIntersecting && entry.boundingClientRect.top < topY) {
            topY = entry.boundingClientRect.top;
            topId = id;
          }
        }
        if (topId) {
          setActiveId(topId);
        }
      },
      { rootMargin: "-96px 0px -60% 0px", threshold: 0 },
    );

    const allIds = ORG_GUIDE_SECTIONS.flatMap((s) => [
      s.id,
      ...(s.subsections?.map((sub) => sub.id) ?? []),
    ]);
    const sectionEls = allIds
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    for (const el of sectionEls) {
      observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative lg:grid lg:grid-cols-[220px_1fr] lg:gap-10">
      {/* Mobile TOC toggle */}
      <div className="mb-6 lg:hidden">
        <button
          type="button"
          onClick={() => setTocOpen((prev) => !prev)}
          className="flex w-full items-center gap-2 rounded-lg border border-border/60 bg-card px-4 py-2.5 text-sm font-medium text-foreground"
        >
          <List className="h-4 w-4 text-muted-foreground" />
          Table of contents
          <span className="ml-auto text-xs text-muted-foreground">
            {tocOpen ? "Hide" : "Show"}
          </span>
        </button>
        {tocOpen ? (
          <div className="mt-2 rounded-lg border border-border/60 bg-card p-3">
            <TableOfContents
              sections={ORG_GUIDE_SECTIONS}
              activeId={activeId}
            />
          </div>
        ) : null}
      </div>

      {/* Desktop sticky TOC */}
      <aside className="hidden lg:block">
        <div className="sticky top-24">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            In this guide
          </p>
          <TableOfContents sections={ORG_GUIDE_SECTIONS} activeId={activeId} />
        </div>
      </aside>

      {/* Content column */}
      <div className="min-w-0 space-y-12">
        {header}
        {ORG_GUIDE_SECTIONS.map((section) => (
          <GuideSection key={section.id} section={section} />
        ))}
        {footer}
      </div>
    </div>
  );
}
