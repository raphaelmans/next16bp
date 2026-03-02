import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

type JournalEntry = {
  idx: number;
  version: string;
  when: number;
  tag: string;
  breakpoints: boolean;
};

type JournalFile = {
  version: string;
  dialect: string;
  entries: JournalEntry[];
};

type SnapshotFile = {
  id: string;
  prevId: string;
};

const ZERO_UUID = "00000000-0000-0000-0000-000000000000";
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuid = (value: string): boolean =>
  value === ZERO_UUID || UUID_REGEX.test(value);

const sortLex = (a: string, b: string): number => a.localeCompare(b);

const readJson = async <T>(filePath: string): Promise<T> => {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
};

async function main() {
  const repoRoot = process.cwd();
  const drizzleDir = path.join(repoRoot, "drizzle");
  const metaDir = path.join(drizzleDir, "meta");
  const journalPath = path.join(metaDir, "_journal.json");

  const [drizzleFiles, metaFiles, journal] = await Promise.all([
    readdir(drizzleDir),
    readdir(metaDir),
    readJson<JournalFile>(journalPath),
  ]);

  const sqlTags = drizzleFiles
    .filter((file) => file.endsWith(".sql"))
    .map((file) => file.replace(/\.sql$/, ""))
    .sort(sortLex);

  const journalEntries = journal.entries ?? [];
  const journalTags = journalEntries.map((entry) => entry.tag);
  const errors: string[] = [];

  const duplicateJournalTags = journalTags.filter(
    (tag, index) => journalTags.indexOf(tag) !== index,
  );

  if (duplicateJournalTags.length > 0) {
    errors.push(
      `Duplicate journal tags: ${Array.from(new Set(duplicateJournalTags)).join(", ")}`,
    );
  }

  for (let idx = 0; idx < journalEntries.length; idx++) {
    const entry = journalEntries[idx];
    if (entry.idx !== idx) {
      errors.push(
        `Journal idx mismatch for tag "${entry.tag}": expected ${idx}, received ${entry.idx}`,
      );
    }
  }

  const missingInJournal = sqlTags.filter((tag) => !journalTags.includes(tag));
  const extraInJournal = journalTags.filter((tag) => !sqlTags.includes(tag));

  if (missingInJournal.length > 0) {
    errors.push(`Missing journal tags: ${missingInJournal.join(", ")}`);
  }

  if (extraInJournal.length > 0) {
    errors.push(`Unknown journal tags: ${extraInJournal.join(", ")}`);
  }

  const snapshotFiles = metaFiles
    .filter((file) => file.endsWith("_snapshot.json"))
    .sort(sortLex);

  let previousSnapshotId: string | null = null;

  for (let idx = 0; idx < snapshotFiles.length; idx++) {
    const snapshotFile = snapshotFiles[idx];
    const snapshotPath = path.join(metaDir, snapshotFile);
    const snapshot = await readJson<SnapshotFile>(snapshotPath);

    if (!isUuid(snapshot.id)) {
      errors.push(
        `Invalid snapshot id in ${snapshotFile}: expected UUID, received "${snapshot.id}"`,
      );
    }

    if (!isUuid(snapshot.prevId)) {
      errors.push(
        `Invalid snapshot prevId in ${snapshotFile}: expected UUID, received "${snapshot.prevId}"`,
      );
    }

    if (idx === 0) {
      if (snapshot.prevId !== ZERO_UUID) {
        errors.push(
          `First snapshot ${snapshotFile} must have prevId ${ZERO_UUID}, received "${snapshot.prevId}"`,
        );
      }
    } else if (previousSnapshotId && snapshot.prevId !== previousSnapshotId) {
      errors.push(
        `Snapshot chain mismatch in ${snapshotFile}: expected prevId "${previousSnapshotId}", received "${snapshot.prevId}"`,
      );
    }

    previousSnapshotId = snapshot.id;
  }

  if (errors.length > 0) {
    console.error("Drizzle journal check failed:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.info(
    JSON.stringify(
      {
        ok: true,
        sqlMigrationCount: sqlTags.length,
        journalEntryCount: journalEntries.length,
        snapshotCount: snapshotFiles.length,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("Failed to check Drizzle journal", error);
  process.exit(1);
});
