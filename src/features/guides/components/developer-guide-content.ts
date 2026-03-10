import {
  BookOpen,
  KeyRound,
  Link2,
  PlugZap,
  RadioTower,
  TerminalSquare,
} from "lucide-react";
import type {
  InteractiveGuideAccordionItem,
  InteractiveGuideCallout,
  InteractiveGuideSection,
  InteractiveGuideSubsection,
  InteractiveGuideTip,
} from "@/features/guides/components/interactive-guide-types";

export type DeveloperGuideTip = InteractiveGuideTip;
export type DeveloperGuideCallout = InteractiveGuideCallout;
export type DeveloperGuideAccordionItem = InteractiveGuideAccordionItem;
export type DeveloperGuideSubsection = InteractiveGuideSubsection;
export type DeveloperGuideSection = InteractiveGuideSection;

export const DEVELOPER_GUIDE_SECTIONS: DeveloperGuideSection[] = [
  {
    id: "create-integration",
    stepNumber: 1,
    icon: PlugZap,
    title: "Create one integration for each external platform",
    paragraphs: [
      "Start in the Developers dashboard by creating a named integration for the external system that will control or read availability. Think of an integration as the operational boundary for one venue system, one partner, or one deployment environment.",
      "Keeping integrations separate matters because keys, mapped external court IDs, and readiness checks all live inside that boundary. If you merge multiple systems into one integration too early, the dashboard becomes harder to reason about and handoff becomes riskier.",
      "As soon as the integration exists, the launchpad can track progress through keys, mappings, precheck, and the guided test console. That makes it clear what still blocks a safe handoff.",
    ],
    tip: {
      text: "Use the same naming convention your external engineering team already uses internally, such as 'Acme OMS Production' or 'Venue ERP Sandbox'.",
    },
    accordionItems: [
      {
        trigger:
          "Should I create one integration per venue or per partner system?",
        content:
          "Prefer one integration per external system or deployment context. If a single external platform controls multiple venues, keep it under one integration and use court mappings to connect its IDs to the right courts.",
      },
      {
        trigger: "Can I rename an integration later?",
        content:
          "Yes. The name is mainly for operator clarity in the dashboard, not a public API identifier for developers.",
      },
    ],
  },
  {
    id: "issue-key",
    stepNumber: 2,
    icon: KeyRound,
    title: "Issue a scoped server key and capture the one-time secret",
    paragraphs: [
      "After the integration is created, issue a server-side API key with only the scopes the partner needs. The dashboard shows the plaintext secret once, then stores only the masked prefix and metadata afterward.",
      "This is the moment to capture the secret in the partner's secret manager. The dashboard is intentionally optimized for a smooth handoff: the same card shows the current scopes, IP allowlist notes, and recent usage metadata after the reveal moment passes.",
      "If the partner only needs live reads at first, start with `availability.read`. Add write scope only when they are actually ready to push availability changes into the platform.",
    ],
    tip: {
      text: "Use narrow scopes for onboarding and widen them later. It is easier to add access than to unwind an over-permissive key after handoff.",
    },
    callout: {
      text: "The snippets panel intentionally falls back to YOUR_API_KEY unless the currently selected key is the same one that was just revealed. That keeps the dashboard from re-exposing masked secrets later.",
    },
    accordionItems: [
      {
        trigger: "Why does the dashboard only show the secret once?",
        content:
          "Because the key is treated like a real server secret, not a retrievable password. After creation, the product keeps only the metadata needed to identify or revoke it safely.",
      },
      {
        trigger: "What is the point of the IP allowlist field?",
        content:
          "It lets you limit which servers can use the key. For integrations that always originate from a known backend or NAT range, this gives you one more strong guardrail before launch.",
      },
    ],
  },
  {
    id: "map-courts",
    stepNumber: 3,
    icon: Link2,
    title: "Map external court IDs to live inventory",
    paragraphs: [
      "The mapping table is where you connect each external court identifier to a real bookable court in the organization. The dashboard uses the same active venue and court inventory that operators already manage elsewhere in the platform.",
      "This is the step that makes the rest of the workflow meaningful. Precheck, live reads, and write calls all depend on a valid external court ID mapping — without it, the API has no safe way to resolve the partner's identifiers to the internal booking model.",
      "The guide should be read with the expectation that the table mirrors the live Developers dashboard exactly, but preview snippets can crop down to the relevant rows so the article stays readable.",
    ],
    tip: {
      text: "Start with one mapped court first. Once precheck passes on that court, expand the same pattern across the rest of the venue.",
    },
    accordionItems: [
      {
        trigger: "What happens if the external platform renames a court?",
        content:
          "Update the mapping row in the dashboard so the external ID stays aligned with the internal court. The readiness checks and snippets will then use the new value automatically.",
      },
      {
        trigger: "Should I map inactive or staging courts?",
        content:
          "Only map the courts that should participate in the integration. The point of the table is to make the external system line up with real, intentional inventory.",
      },
    ],
  },
  {
    id: "run-precheck",
    stepNumber: 4,
    icon: RadioTower,
    title: "Run the precheck before handing anything off",
    paragraphs: [
      "The precheck is the fastest way to validate readiness without sending the external engineering team on a blind integration attempt. It runs server-side and checks the fixed onboarding contract: integration health, key health, required scope, mapping existence, and a live sample availability read.",
      "That means the product can catch the most common launch blockers before anyone copies a single snippet into a server. If the check fails, the response includes enough detail to tell you whether the problem is the integration setup, the key, the selected external court, or the live availability path.",
      "Use the precheck whenever you change mappings or rotate keys. It is not just for first launch — it is the safest quick regression scan for the whole integration setup.",
    ],
    tip: {
      text: "Treat a green precheck as the minimum handoff bar. If it is not green, the external team should not be asked to debug the connection yet.",
    },
    callout: {
      text: "The precheck uses protected internal management routes and never requires the browser to re-send a stored plaintext key. That keeps the safety model aligned with production key handling.",
    },
  },
  {
    id: "guided-console",
    stepNumber: 5,
    icon: TerminalSquare,
    title: "Run one safe live availability read in the guided console",
    paragraphs: [
      "The guided test console is intentionally narrow: one live, read-only availability request that runs server-side against the currently selected integration, key, mapped external court, date, and duration.",
      "This is enough to prove the end-to-end path works without turning the dashboard into a general-purpose API playground. The operator gets a visible request shape, the response payload, and the request ID needed for support or deeper investigation.",
      "Because the console is locked to a safe read path, it is ideal for onboarding review calls and internal verification. Write calls stay copy-first in v1 so operators and developers can discuss them without accidentally mutating live availability from a browser session.",
    ],
    tip: {
      text: "Use the same date and duration you expect the partner to query in their first real integration test. That makes the console output a true preview of launch-day behavior.",
    },
    accordionItems: [
      {
        trigger: "Why not let the dashboard execute write calls too?",
        content:
          "Because read-only validation covers most onboarding confidence while avoiding accidental browser-driven mutations. The product still gives developers copy-ready write examples for server-side implementation.",
      },
      {
        trigger: "What should I do with the request ID shown in the console?",
        content:
          "Keep it for debugging. If the live sample read fails, the request ID is the fastest way to trace what happened across logs and support triage.",
      },
    ],
  },
  {
    id: "handoff-snippets",
    stepNumber: 6,
    icon: BookOpen,
    title: "Hand off the snippets and OpenAPI contract",
    paragraphs: [
      "Once the integration is green, move to the snippets and docs panel. The page generates cURL and JavaScript examples from the currently selected mapped external court and test inputs, then links directly to the public OpenAPI document for the full contract.",
      "This is where operator UX and developer DX meet: the operator can confirm the selected values look right, and the external engineering team gets a starting point that already matches the live dashboard state instead of a generic sample lifted from separate documentation.",
      "Use the generated snippets as the handoff artifact, but keep the OpenAPI spec in the package too. The snippets explain the first request; the contract explains the whole surface.",
    ],
    tip: {
      text: "Share the snippet and the OpenAPI link together. Snippets accelerate the first request, while the spec answers follow-up integration questions.",
    },
  },
];
