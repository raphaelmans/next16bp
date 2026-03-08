import type { LucideIcon } from "lucide-react";

export type InteractiveGuideTip = {
  text: string;
};

export type InteractiveGuideCallout = {
  text: string;
};

export type InteractiveGuideAccordionItem = {
  trigger: string;
  content: string;
};

export type InteractiveGuideSubsection = {
  id: string;
  title: string;
  paragraphs: string[];
  tip?: InteractiveGuideTip;
  callout?: InteractiveGuideCallout;
  accordionItems?: InteractiveGuideAccordionItem[];
};

export type InteractiveGuideSection = {
  id: string;
  stepNumber: number;
  icon: LucideIcon;
  title: string;
  isOptional?: boolean;
  paragraphs: string[];
  tip?: InteractiveGuideTip;
  callout?: InteractiveGuideCallout;
  accordionItems?: InteractiveGuideAccordionItem[];
  subsections?: InteractiveGuideSubsection[];
};
