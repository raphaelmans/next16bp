"use client";

import { Lightbulb, List } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type {
  InteractiveGuideSection,
  InteractiveGuideSubsection,
} from "@/features/guides/components/interactive-guide-types";
import { cn } from "@/lib/utils";

type TocEntry = {
  id: string;
  label: string;
  isSubsection: boolean;
  isOptional?: boolean;
};

function buildTocEntries(sections: InteractiveGuideSection[]): TocEntry[] {
  const entries: TocEntry[] = [];
  for (const section of sections) {
    entries.push({
      id: section.id,
      label: `${section.stepNumber}. ${section.title}`,
      isSubsection: false,
      isOptional: section.isOptional,
    });

    for (const subsection of section.subsections ?? []) {
      entries.push({
        id: subsection.id,
        label: subsection.title,
        isSubsection: true,
      });
    }
  }
  return entries;
}

function TableOfContents({
  sections,
  activeId,
}: {
  sections: InteractiveGuideSection[];
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

function GuideSubsection({
  subsection,
  getSnippetForSection,
}: {
  subsection: InteractiveGuideSubsection;
  getSnippetForSection: (sectionId: string) => React.ComponentType | null;
}) {
  const Snippet = getSnippetForSection(subsection.id);

  return (
    <div id={subsection.id} className="scroll-mt-24 space-y-5 pt-2">
      <h3 className="font-heading text-xl font-semibold tracking-tight">
        {subsection.title}
      </h3>

      {subsection.paragraphs.map((paragraph) => (
        <p key={paragraph} className="text-sm leading-7 text-muted-foreground">
          {paragraph}
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
        <div className="rounded-r-lg border-l-2 border-primary/40 bg-muted/40 py-3 pl-4 pr-3">
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

function GuideSection({
  section,
  getSnippetForSection,
}: {
  section: InteractiveGuideSection;
  getSnippetForSection: (sectionId: string) => React.ComponentType | null;
}) {
  const Icon = section.icon;
  const Snippet = getSnippetForSection(section.id);

  return (
    <section id={section.id} className="scroll-mt-24 space-y-5">
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

      {section.paragraphs.map((paragraph) => (
        <p key={paragraph} className="text-sm leading-7 text-muted-foreground">
          {paragraph}
        </p>
      ))}

      {Snippet ? <Snippet /> : null}

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

      {section.callout ? (
        <div className="rounded-r-lg border-l-2 border-primary/40 bg-muted/40 py-3 pl-4 pr-3">
          <p className="text-sm leading-6 text-muted-foreground">
            {section.callout.text}
          </p>
        </div>
      ) : null}

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

      {section.subsections?.map((subsection) => (
        <GuideSubsection
          key={subsection.id}
          subsection={subsection}
          getSnippetForSection={getSnippetForSection}
        />
      ))}
    </section>
  );
}

export function InteractiveGuideArticlePage({
  sections,
  getSnippetForSection,
  header,
  footer,
}: {
  sections: InteractiveGuideSection[];
  getSnippetForSection: (sectionId: string) => React.ComponentType | null;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");
  const [tocOpen, setTocOpen] = useState(false);
  const sectionRefs = useRef<Map<string, IntersectionObserverEntry>>(new Map());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          sectionRefs.current.set(entry.target.id, entry);
        }

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

    const allIds = sections.flatMap((section) => [
      section.id,
      ...(section.subsections?.map((subsection) => subsection.id) ?? []),
    ]);

    const sectionElements = allIds
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    for (const element of sectionElements) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [sections]);

  return (
    <div className="relative lg:grid lg:grid-cols-[220px_1fr] lg:gap-10">
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
            <TableOfContents sections={sections} activeId={activeId} />
          </div>
        ) : null}
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-24">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            In this guide
          </p>
          <TableOfContents sections={sections} activeId={activeId} />
        </div>
      </aside>

      <div className="min-w-0 space-y-12">
        {header}
        {sections.map((section) => (
          <GuideSection
            key={section.id}
            section={section}
            getSnippetForSection={getSnippetForSection}
          />
        ))}
        {footer}
      </div>
    </div>
  );
}
