/**
 * Generates a realistic ICS file with ~25 events across February 2026
 * (8am–8pm Asia/Manila) and runs it through normalize-data.ts to verify
 * ICS→blocks normalization works.
 *
 * Usage: npx tsx scripts/test-tier0-ics-feb.ts
 */

import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// ── Helpers ──────────────────────────────────────────────────────────────────

const icsEvent = (opts: {
  uid: string;
  dtstart: string;
  dtend: string;
  summary: string;
  location: string;
}) => {
  const lines = [
    "BEGIN:VEVENT",
    `UID:${opts.uid}`,
    "DTSTAMP:20260101T000000Z",
    `DTSTART:${opts.dtstart}`,
    `DTEND:${opts.dtend}`,
    `SUMMARY:${opts.summary}`,
    `LOCATION:${opts.location}`,
    "END:VEVENT",
  ];
  return lines.join("\r\n");
};

const wrapIcs = (events: string[]) =>
  [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TestSuite//FebICS//EN",
    "CALSCALE:GREGORIAN",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");

// ── Seed-based pseudo-random (deterministic) ────────────────────────────────

let seed = 42;
const rand = () => {
  seed = (seed * 16807 + 0) % 2147483647;
  return (seed - 1) / 2147483646;
};
const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const randInt = (min: number, max: number) =>
  min + Math.floor(rand() * (max - min + 1));

// ── Generate events ─────────────────────────────────────────────────────────

const courts = ["Court A", "Court B"];
const summaries = [
  "Open play",
  "League match",
  "Coaching",
  "Walk-in",
  "Private booking",
  "Tournament",
  "Training session",
  "Junior clinic",
];

const events: string[] = [];

for (let i = 0; i < 25; i++) {
  const day = randInt(1, 28);
  // Start hour 0–10 UTC = 8am–6pm Manila (UTC+8)
  const startHourUtc = randInt(0, 10);
  const durationHours = randInt(1, 3);
  // Clamp so end ≤ 12:00 UTC (8pm Manila)
  const endHourUtc = Math.min(startHourUtc + durationHours, 12);

  const dd = String(day).padStart(2, "0");
  const sh = String(startHourUtc).padStart(2, "0");
  const eh = String(endHourUtc).padStart(2, "0");

  events.push(
    icsEvent({
      uid: `feb2026-${i}@test`,
      dtstart: `202602${dd}T${sh}0000Z`,
      dtend: `202602${dd}T${eh}0000Z`,
      summary: pick(summaries),
      location: pick(courts),
    }),
  );
}

// ── Write files ─────────────────────────────────────────────────────────────

const tmpDir = join(process.cwd(), ".tmp-ics-feb-test");
mkdirSync(tmpDir, { recursive: true });

const icsPath = join(tmpDir, "feb2026.ics");
const mappingPath = join(tmpDir, "feb2026-mapping.json");

writeFileSync(icsPath, wrapIcs(events));

writeFileSync(
  mappingPath,
  JSON.stringify(
    {
      format: "ics",
      version: 1,
      resource: { kind: "location" },
      reason: { kind: "summary" },
      sport: { kind: "infer" },
      parsing: {
        timeZoneFallback: "Asia/Manila",
        ignoreCancelled: true,
        ignoreAllDay: true,
      },
    },
    null,
    2,
  ),
);

console.log(`ICS file: ${icsPath}`);
console.log(`Mapping:  ${mappingPath}`);
console.log("Running normalize-data.ts...\n");

// ── Run normalize-data ──────────────────────────────────────────────────────

try {
  const result = execSync(
    [
      "npx tsx scripts/normalize-data.ts",
      `--path=${icsPath}`,
      "--format=ics",
      "--no-ai",
      `--mapping-file=${mappingPath}`,
      "--range-start=2026-02-01T00:00:00Z",
      "--range-end=2026-02-28T23:59:59Z",
      "--time-zone=Asia/Manila",
    ].join(" "),
    { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 },
  );

  const parsed = JSON.parse(result);
  console.log(`Blocks: ${parsed.blocks?.length ?? "N/A"}`);
  console.log(`Errors: ${parsed.errors?.length ?? 0}`);
  console.log("\n--- Output ---");
  console.log(JSON.stringify(parsed, null, 2));
} catch (err: unknown) {
  console.error("normalize-data.ts failed:");
  if (err && typeof err === "object" && "stdout" in err) {
    console.error((err as { stdout?: unknown }).stdout);
  } else if (err instanceof Error) {
    console.error(err.message);
  } else {
    console.error(String(err));
  }
  process.exit(1);
}
