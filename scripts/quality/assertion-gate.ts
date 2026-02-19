import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const BASELINE_RELATIVE_PATH = "scripts/quality/assertion-baseline.json";
const TOP_FILES_LIMIT = 15;

type AssertionClassification =
  | "as any"
  | "as never"
  | "as unknown as"
  | "as const"
  | "as Record<string, unknown>"
  | "raw as Record<string, unknown>"
  | "other";

type AssertionFinding = {
  key: string;
  file: string;
  line: number;
  column: number;
  classification: AssertionClassification;
  nodeText: string;
};

type BaselineFinding = {
  key: string;
  file: string;
  classification: AssertionClassification;
  nodeText: string;
};

type BaselineAllowlistEntry =
  | string
  | {
      key?: string;
      file?: string;
      classification?: string;
      nodeText?: string;
      count?: number;
      reason?: string;
    };

type AssertionBaseline = {
  version: 1;
  generatedAt: string;
  findings: BaselineFinding[];
  allowlist: BaselineAllowlistEntry[];
};

type KeyCountMap = Map<string, number>;

const ROOT = process.cwd();
const BASELINE_PATH = path.resolve(ROOT, BASELINE_RELATIVE_PATH);

const REQUIRED_CLASSIFICATION_ORDER: AssertionClassification[] = [
  "as any",
  "as never",
  "as unknown as",
  "as const",
  "as Record<string, unknown>",
  "raw as Record<string, unknown>",
  "other",
];

const toPosixPath = (filePath: string): string =>
  filePath.split(path.sep).join("/");

const normalizeWhitespace = (text: string): string =>
  text.replace(/\s+/g, " ").trim();

const normalizeTypeText = (text: string): string =>
  text.replace(/\s+/g, "").trim();

const isTypeScriptSourceFile = (relativePath: string): boolean => {
  const normalizedPath = toPosixPath(relativePath);
  if (!normalizedPath.startsWith("src/")) {
    return false;
  }
  if (normalizedPath.endsWith(".d.ts")) {
    return false;
  }
  return /\.(ts|tsx|mts)$/.test(normalizedPath);
};

const listSourceFiles = (): string[] => {
  try {
    const output = execFileSync(
      "git",
      [
        "ls-files",
        "-z",
        "--cached",
        "--others",
        "--exclude-standard",
        "--",
        "src",
      ],
      { cwd: ROOT, encoding: "utf-8" },
    );

    const paths = output
      .split("\u0000")
      .filter(Boolean)
      .filter(isTypeScriptSourceFile)
      .map((relativePath) => path.resolve(ROOT, relativePath))
      .filter((absolutePath) => fs.existsSync(absolutePath));

    return [...new Set(paths)].sort();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    process.stderr.write(
      `Warning: git ls-files failed (${message}). Falling back to src directory walk.\n`,
    );

    const fallback = ts.sys
      .readDirectory(
        path.resolve(ROOT, "src"),
        [".ts", ".tsx", ".mts"],
        undefined,
        undefined,
      )
      .filter((absolutePath) => {
        const relativePath = toPosixPath(path.relative(ROOT, absolutePath));
        return isTypeScriptSourceFile(relativePath);
      });

    return [...new Set(fallback)].sort();
  }
};

const getScriptKind = (filePath: string): ts.ScriptKind => {
  if (filePath.endsWith(".tsx")) {
    return ts.ScriptKind.TSX;
  }
  return ts.ScriptKind.TS;
};

const unwrapParenthesizedExpression = (
  expression: ts.Expression,
): ts.Expression => {
  let current = expression;
  while (ts.isParenthesizedExpression(current)) {
    current = current.expression;
  }
  return current;
};

const isAssertionNode = (
  node: ts.Node,
): node is ts.AsExpression | ts.TypeAssertion =>
  ts.isAsExpression(node) || ts.isTypeAssertionExpression(node);

const isAssertionToUnknown = (
  node: ts.Node,
  sourceFile: ts.SourceFile,
): boolean => {
  if (!isAssertionNode(node)) {
    return false;
  }
  const normalizedTypeText = normalizeTypeText(node.type.getText(sourceFile));
  return normalizedTypeText === "unknown";
};

const computeFindingKey = (
  file: string,
  classification: AssertionClassification,
  nodeText: string,
): string =>
  createHash("sha1")
    .update(`${file}|${classification}|${normalizeWhitespace(nodeText)}`)
    .digest("hex");

const classifyAssertion = (
  node: ts.AsExpression | ts.TypeAssertion,
  sourceFile: ts.SourceFile,
): AssertionClassification => {
  const normalizedTypeText = normalizeTypeText(node.type.getText(sourceFile));

  const unwrappedExpression = unwrapParenthesizedExpression(node.expression);
  if (isAssertionToUnknown(unwrappedExpression, sourceFile)) {
    return "as unknown as";
  }

  if (normalizedTypeText === "any") {
    return "as any";
  }

  if (normalizedTypeText === "never") {
    return "as never";
  }

  if (normalizedTypeText === "const") {
    return "as const";
  }

  if (normalizedTypeText === "Record<string,unknown>") {
    const expressionText = normalizeWhitespace(
      unwrapParenthesizedExpression(node.expression).getText(sourceFile),
    );
    if (expressionText === "raw") {
      return "raw as Record<string, unknown>";
    }
    return "as Record<string, unknown>";
  }

  return "other";
};

const collectAssertionsFromFile = (
  absolutePath: string,
): AssertionFinding[] => {
  const sourceText = fs.readFileSync(absolutePath, "utf-8");
  const sourceFile = ts.createSourceFile(
    absolutePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    getScriptKind(absolutePath),
  );

  const findings: AssertionFinding[] = [];
  const file = toPosixPath(path.relative(ROOT, absolutePath));

  const visit = (node: ts.Node): void => {
    if (isAssertionNode(node)) {
      const classification = classifyAssertion(node, sourceFile);
      const start = node.getStart(sourceFile);
      const location = sourceFile.getLineAndCharacterOfPosition(start);
      const nodeText = normalizeWhitespace(node.getText(sourceFile));

      findings.push({
        key: computeFindingKey(file, classification, nodeText),
        file,
        line: location.line + 1,
        column: location.character + 1,
        classification,
        nodeText,
      });
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return findings;
};

const collectAssertions = (absoluteFilePaths: string[]): AssertionFinding[] => {
  const findings = absoluteFilePaths.flatMap((absolutePath) =>
    collectAssertionsFromFile(absolutePath),
  );

  return findings.sort((a, b) => {
    if (a.file !== b.file) {
      return a.file.localeCompare(b.file);
    }
    if (a.line !== b.line) {
      return a.line - b.line;
    }
    if (a.column !== b.column) {
      return a.column - b.column;
    }
    return a.classification.localeCompare(b.classification);
  });
};

const createBaseline = (findings: AssertionFinding[]): AssertionBaseline => ({
  version: 1,
  generatedAt: new Date().toISOString(),
  findings: findings.map((finding) => ({
    key: finding.key,
    file: finding.file,
    classification: finding.classification,
    nodeText: finding.nodeText,
  })),
  allowlist: [],
});

const writeBaseline = (baseline: AssertionBaseline): void => {
  fs.mkdirSync(path.dirname(BASELINE_PATH), { recursive: true });
  fs.writeFileSync(
    BASELINE_PATH,
    `${JSON.stringify(baseline, null, 2)}\n`,
    "utf-8",
  );
};

const isAssertionClassification = (
  value: string,
): value is AssertionClassification =>
  REQUIRED_CLASSIFICATION_ORDER.includes(value as AssertionClassification);

const keyFromBaselineParts = (
  file: string,
  classification: string,
  nodeText: string,
): string | null => {
  if (!isAssertionClassification(classification)) {
    return null;
  }
  return computeFindingKey(toPosixPath(file), classification, nodeText);
};

const parseBaseline = (rawText: string): AssertionBaseline => {
  const parsed = JSON.parse(rawText) as Partial<AssertionBaseline>;
  const findings = Array.isArray(parsed.findings) ? parsed.findings : [];
  const allowlist = Array.isArray(parsed.allowlist) ? parsed.allowlist : [];

  return {
    version: 1,
    generatedAt:
      typeof parsed.generatedAt === "string"
        ? parsed.generatedAt
        : new Date(0).toISOString(),
    findings: findings
      .map((entry) => {
        if (!entry || typeof entry !== "object") {
          return null;
        }

        const file =
          "file" in entry && typeof entry.file === "string"
            ? toPosixPath(entry.file)
            : null;
        const classification =
          "classification" in entry && typeof entry.classification === "string"
            ? entry.classification
            : null;
        const nodeText =
          "nodeText" in entry && typeof entry.nodeText === "string"
            ? entry.nodeText
            : null;
        const key =
          "key" in entry && typeof entry.key === "string"
            ? entry.key
            : file && classification && nodeText
              ? keyFromBaselineParts(file, classification, nodeText)
              : null;

        if (!file || !classification || !nodeText || !key) {
          return null;
        }

        if (!isAssertionClassification(classification)) {
          return null;
        }

        return {
          key,
          file,
          classification,
          nodeText,
        } satisfies BaselineFinding;
      })
      .filter((entry): entry is BaselineFinding => entry !== null),
    allowlist,
  };
};

const incrementKeyCount = (map: KeyCountMap, key: string, amount = 1): void => {
  map.set(key, (map.get(key) ?? 0) + amount);
};

const getCountsByKey = (
  findings: Pick<AssertionFinding, "key">[],
): KeyCountMap => {
  const counts: KeyCountMap = new Map();
  for (const finding of findings) {
    incrementKeyCount(counts, finding.key);
  }
  return counts;
};

const getAllowlistCounts = (
  allowlist: BaselineAllowlistEntry[],
): KeyCountMap => {
  const counts: KeyCountMap = new Map();

  for (const entry of allowlist) {
    if (typeof entry === "string") {
      if (entry.length > 0) {
        incrementKeyCount(counts, entry);
      }
      continue;
    }

    if (!entry || typeof entry !== "object") {
      continue;
    }

    const amount =
      typeof entry.count === "number" &&
      Number.isFinite(entry.count) &&
      entry.count > 0
        ? Math.floor(entry.count)
        : 1;

    if (typeof entry.key === "string" && entry.key.length > 0) {
      incrementKeyCount(counts, entry.key, amount);
      continue;
    }

    if (
      typeof entry.file === "string" &&
      typeof entry.classification === "string" &&
      typeof entry.nodeText === "string"
    ) {
      const key = keyFromBaselineParts(
        entry.file,
        entry.classification,
        entry.nodeText,
      );
      if (key) {
        incrementKeyCount(counts, key, amount);
      }
    }
  }

  return counts;
};

const mergeCounts = (base: KeyCountMap, extra: KeyCountMap): KeyCountMap => {
  const merged: KeyCountMap = new Map(base);
  for (const [key, count] of extra.entries()) {
    incrementKeyCount(merged, key, count);
  }
  return merged;
};

const getExcessFindings = (
  findings: AssertionFinding[],
  allowedCounts: KeyCountMap,
): AssertionFinding[] => {
  const findingsByKey = new Map<string, AssertionFinding[]>();

  for (const finding of findings) {
    const existing = findingsByKey.get(finding.key);
    if (existing) {
      existing.push(finding);
    } else {
      findingsByKey.set(finding.key, [finding]);
    }
  }

  const excess: AssertionFinding[] = [];

  for (const [key, groupedFindings] of findingsByKey.entries()) {
    const allowedCount = allowedCounts.get(key) ?? 0;
    if (groupedFindings.length > allowedCount) {
      excess.push(...groupedFindings.slice(allowedCount));
    }
  }

  return excess;
};

const printSummary = (
  filesScanned: number,
  findings: AssertionFinding[],
): void => {
  const filesWithAssertions = new Set(findings.map((finding) => finding.file))
    .size;
  const totalsByClassification = new Map<AssertionClassification, number>();
  for (const classification of REQUIRED_CLASSIFICATION_ORDER) {
    totalsByClassification.set(classification, 0);
  }

  for (const finding of findings) {
    totalsByClassification.set(
      finding.classification,
      (totalsByClassification.get(finding.classification) ?? 0) + 1,
    );
  }

  const fileCounts = new Map<string, number>();
  for (const finding of findings) {
    fileCounts.set(finding.file, (fileCounts.get(finding.file) ?? 0) + 1);
  }

  const topFiles = [...fileCounts.entries()]
    .sort((a, b) => {
      if (a[1] !== b[1]) {
        return b[1] - a[1];
      }
      return a[0].localeCompare(b[0]);
    })
    .slice(0, TOP_FILES_LIMIT);

  process.stdout.write("Assertion gate summary\n");
  process.stdout.write(`- Files scanned: ${filesScanned}\n`);
  process.stdout.write(`- Assertions found: ${findings.length}\n`);
  process.stdout.write(`- Files with assertions: ${filesWithAssertions}\n`);
  process.stdout.write("\nClassification totals\n");
  for (const classification of REQUIRED_CLASSIFICATION_ORDER) {
    process.stdout.write(
      `- ${classification}: ${totalsByClassification.get(classification) ?? 0}\n`,
    );
  }

  process.stdout.write(`\nTop ${TOP_FILES_LIMIT} files by assertion count\n`);
  if (topFiles.length === 0) {
    process.stdout.write("- none\n");
  }

  for (const [file, count] of topFiles) {
    process.stdout.write(`- ${file}: ${count}\n`);
  }
};

const printFindings = (findings: AssertionFinding[]): void => {
  process.stdout.write("\nFindings\n");
  if (findings.length === 0) {
    process.stdout.write("- none\n");
    return;
  }

  for (const finding of findings) {
    process.stdout.write(
      `- ${finding.file}:${finding.line}:${finding.column} [${finding.classification}] ${finding.nodeText}\n`,
    );
  }
};

const run = (): void => {
  const sourceFiles = listSourceFiles();
  const findings = collectAssertions(sourceFiles);

  printSummary(sourceFiles.length, findings);
  printFindings(findings);

  if (!fs.existsSync(BASELINE_PATH)) {
    const baseline = createBaseline(findings);
    writeBaseline(baseline);
    process.stdout.write(
      `\nBaseline did not exist. Created ${BASELINE_RELATIVE_PATH} from current scan.\n`,
    );
    return;
  }

  const baselineRaw = fs.readFileSync(BASELINE_PATH, "utf-8");
  const baseline = parseBaseline(baselineRaw);

  const baselineAsConst = baseline.findings.filter(
    (finding) => finding.classification === "as const",
  );
  const baselineNonConst = baseline.findings.filter(
    (finding) => finding.classification !== "as const",
  );

  const currentAsConst = findings.filter(
    (finding) => finding.classification === "as const",
  );
  const currentNonConst = findings.filter(
    (finding) => finding.classification !== "as const",
  );

  const allowlistCounts = getAllowlistCounts(baseline.allowlist);
  const allowedNonConstCounts = mergeCounts(
    getCountsByKey(baselineNonConst),
    allowlistCounts,
  );
  const allowedAsConstCounts = mergeCounts(
    getCountsByKey(baselineAsConst),
    allowlistCounts,
  );

  const newNonConstFindings = getExcessFindings(
    currentNonConst,
    allowedNonConstCounts,
  );
  const newAsConstFindings = getExcessFindings(
    currentAsConst,
    allowedAsConstCounts,
  );

  process.stdout.write("\nBaseline comparison\n");
  process.stdout.write(
    `- Baseline findings tracked: ${baseline.findings.length}\n`,
  );
  process.stdout.write(
    `- Baseline allowlist entries: ${baseline.allowlist.length}\n`,
  );
  process.stdout.write(
    `- New non-as const assertions: ${newNonConstFindings.length}\n`,
  );
  process.stdout.write(
    `- New as const assertions: ${newAsConstFindings.length}\n`,
  );

  if (newAsConstFindings.length > 0) {
    process.stdout.write("\nNew as const assertions (allowed, tracked)\n");
    for (const finding of newAsConstFindings) {
      process.stdout.write(
        `- ${finding.file}:${finding.line}:${finding.column} [${finding.classification}] ${finding.nodeText}\n`,
      );
    }
  }

  if (newNonConstFindings.length > 0) {
    process.stderr.write(
      "\nAssertion gate failed: new non-as const assertions were introduced.\n",
    );
    for (const finding of newNonConstFindings) {
      process.stderr.write(
        `- ${finding.file}:${finding.line}:${finding.column} [${finding.classification}] ${finding.nodeText}\n`,
      );
    }
    process.exit(1);
  }

  process.stdout.write(
    "\nAssertion gate passed: no new non-as const assertions were introduced.\n",
  );
};

run();
