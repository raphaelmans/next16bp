#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

function parseArgs(argv) {
  const args = {
    checkpoint: null,
    checkpointPath: null,
    baseHtmlPath: null,
    outHtmlPath: null,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const key = argv[i];
    const value = argv[i + 1];

    if (key === "--checkpoint") {
      args.checkpoint = value;
      i += 1;
      continue;
    }

    if (key === "--checkpoint-path") {
      args.checkpointPath = value;
      i += 1;
      continue;
    }

    if (key === "--base-html") {
      args.baseHtmlPath = value;
      i += 1;
      continue;
    }

    if (key === "--out-html") {
      args.outHtmlPath = value;
      i += 1;
      continue;
    }

    throw new Error(`Unknown arg: ${key}`);
  }

  return args;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function slugify(value) {
  return value
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "")
    .slice(0, 80);
}

function extractTagContents(html, tagName) {
  const re = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i");
  const match = html.match(re);
  if (!match) return null;
  return match[1];
}

function _splitSections(markdown) {
  return markdown.split(/\n---\n/);
}

function parseCheckpointMarkdown(markdown) {
  const lines = markdown.split("\n");

  const headerLine = lines.find((l) => l.startsWith("# Checkpoint")) ?? "";
  const checkpointNumber = headerLine.replace("# Checkpoint", "").trim();

  const dateLine = lines.find((l) => l.startsWith("**Date:**")) ?? "";
  const date = dateLine.replace("**Date:**", "").trim().replace(/\s+$/, "");

  const prevLine =
    lines.find((l) => l.startsWith("**Previous Checkpoint:**")) ?? "";
  const previous = prevLine.replace("**Previous Checkpoint:**", "").trim();

  const coveredLine =
    lines.find((l) => l.startsWith("**Stories Covered:**")) ?? "";
  const covered = coveredLine.replace("**Stories Covered:**", "").trim();

  const summaryStart = lines.findIndex((l) => l.trim() === "## Summary");
  const summary = [];
  if (summaryStart !== -1) {
    for (let i = summaryStart + 1; i < lines.length; i += 1) {
      const line = lines[i];
      if (line.trim() === "---") break;
      if (line.trim().length === 0) continue;
      summary.push(line);
    }
  }

  const storiesTable = [];
  const tableStart = lines.findIndex(
    (l) => l.trim() === "## Stories in This Checkpoint",
  );
  if (tableStart !== -1) {
    for (let i = tableStart + 1; i < lines.length; i += 1) {
      const line = lines[i];
      if (line.trim() === "---") break;
      if (!line.trim().startsWith("|")) continue;
      if (line.includes("|----")) continue;
      if (line.includes("| ID ")) continue;

      const parts = line
        .split("|")
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      if (parts.length !== 4) continue;
      const [id, domain, story, status] = parts;
      if (!id.startsWith("US-")) continue;
      storiesTable.push({ id, domain, story, status });
    }
  }

  const keyDecisions = [];
  const keyDecisionsStart = lines.findIndex(
    (l) => l.trim() === "## Key Decisions",
  );
  if (keyDecisionsStart !== -1) {
    for (let i = keyDecisionsStart + 1; i < lines.length; i += 1) {
      const line = lines[i];
      if (line.trim() === "---") break;
      if (!line.trim().startsWith("- ")) continue;
      keyDecisions.push(line.trim().replace(/^-\s+/, ""));
    }
  }

  const planDeltas = [];
  const planStart = lines.findIndex(
    (l) =>
      l.trim() === "## Agent Plan Deltas (Non-story Fixes / Standardization)",
  );
  if (planStart !== -1) {
    for (let i = planStart + 1; i < lines.length; i += 1) {
      const line = lines[i];
      if (line.trim() === "---") break;
      if (!line.trim().startsWith("|")) continue;
      if (line.includes("|------")) continue;
      if (line.includes("| Plan ")) continue;

      const parts = line
        .split("|")
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      if (parts.length !== 2) continue;
      const [planPathRaw, theme] = parts;
      const planPath = planPathRaw.replaceAll("`", "");
      if (!planPath.endsWith(".md")) continue;
      planDeltas.push({ planPath, theme });
    }
  }

  return {
    checkpointNumber,
    date,
    previous,
    covered,
    summary,
    storiesTable,
    keyDecisions,
    planDeltas,
  };
}

function statusToClass(status) {
  const normalized = status.toLowerCase();
  if (normalized.includes("active")) return "status-active";
  if (normalized.includes("superseded")) return "status-superseded";
  if (normalized.includes("deferred")) return "status-deferred";
  if (normalized.includes("fixed")) return "status-fixed";
  return "status-active";
}

function walkFiles(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const results = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(fullPath));
      continue;
    }
    results.push(fullPath);
  }

  return results;
}

function findStoryFileById(rootDir, storyId) {
  const files = walkFiles(rootDir).filter((p) => p.endsWith(".md"));

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, "utf8");
    const firstLine = content.split("\n")[0] ?? "";
    if (firstLine.startsWith(`# ${storyId}:`)) return filePath;
  }

  return null;
}

function findDomainOverview(domainDir) {
  if (!fs.existsSync(domainDir)) return null;

  const files = fs
    .readdirSync(domainDir)
    .filter((name) => name.endsWith("-00-overview.md"))
    .map((name) => path.join(domainDir, name));

  if (files.length === 0) return null;
  return files[0];
}

function extractOverviewText(markdown) {
  const lines = markdown.split("\n");
  const overviewStart = lines.findIndex((l) => l.trim() === "## Overview");
  if (overviewStart === -1) return null;

  const paragraphs = [];
  for (let i = overviewStart + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.trim().startsWith("## ")) break;
    if (line.trim() === "---") break;
    if (line.trim().length === 0) continue;
    paragraphs.push(line.trim());
  }

  if (paragraphs.length === 0) return null;
  return paragraphs.join(" ");
}

function renderInline(md) {
  let value = escapeHtml(md);
  value = value.replaceAll(/`([^`]+)`/g, "<code>$1</code>");
  value = value.replaceAll(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  return value;
}

function renderBullets(lines) {
  const items = lines
    .map((l) => l.trim())
    .filter((l) => l.startsWith("- "))
    .map((l) => l.replace(/^-\s+/, ""));

  if (items.length === 0) return "";

  const li = items.map((item) => `<li>${renderInline(item)}</li>`).join("\n");

  return `<ul>\n${li}\n</ul>`;
}

function parseMarkdownTable(lines) {
  const rows = lines
    .map((l) => l.trim())
    .filter((l) => l.startsWith("|") && l.endsWith("|"));

  if (rows.length < 3) return null;

  const headerCells = rows[0]
    .split("|")
    .map((c) => c.trim())
    .filter((c) => c.length > 0);

  const bodyRows = rows
    .slice(2)
    .map((row) =>
      row
        .split("|")
        .map((c) => c.trim())
        .filter((c) => c.length > 0),
    )
    .filter((cells) => cells.length === headerCells.length);

  if (headerCells.length === 0 || bodyRows.length === 0) return null;

  return { headerCells, bodyRows };
}

function renderTable(table) {
  const head = table.headerCells
    .map((c) => `<th>${renderInline(c)}</th>`)
    .join("");
  const body = table.bodyRows
    .map(
      (cells) =>
        `<tr>${cells.map((c) => `<td>${renderInline(c)}</td>`).join("")}</tr>`,
    )
    .join("\n");

  return `<table>\n<thead><tr>${head}</tr></thead>\n<tbody>\n${body}\n</tbody>\n</table>`;
}

function parsePlanMarkdownForDerived({ planMarkdown, planPath, theme }) {
  const lines = planMarkdown.split("\n");
  const titleLine = lines.find((l) => l.startsWith("# ")) ?? "";
  const planTitle = titleLine.replace(/^#\s+/, "").trim();

  const overview = extractOverviewText(planMarkdown) ?? "";

  const successCriteria = [];
  const successStart = lines.findIndex(
    (l) => l.trim() === "## Success Criteria",
  );
  if (successStart !== -1) {
    for (let i = successStart + 1; i < lines.length; i += 1) {
      const line = lines[i];
      if (line.trim() === "---") break;
      if (line.trim().startsWith("## ")) break;
      const trimmed = line.trim();
      if (!trimmed.startsWith("- ")) continue;

      const cleaned = trimmed
        .replace(/^-\s+\[ \]\s+/, "")
        .replace(/^-\s+\[x\]\s+/i, "")
        .replace(/^-\s+/, "");

      if (cleaned.length > 0) successCriteria.push(cleaned);
    }
  }

  const planNumberMatch = planPath.match(/agent-plans\/(\d{2})-/);
  const planNumber = planNumberMatch ? planNumberMatch[1] : "XX";

  const narrativeParts = [`Derived from \`${planPath}\`.`, overview].filter(
    (p) => p && p.trim().length > 0,
  );

  const narrative = narrativeParts.join(" ");

  return {
    id: `DS-${planNumber}`,
    title: theme || planTitle,
    status: "Derived",
    narrative,
    criteria: successCriteria.length
      ? [{ title: "Success Criteria", bullets: successCriteria }]
      : [],
    edgeCasesTable: null,
    formFieldsTable: null,
  };
}

function parseStoryMarkdown(markdown) {
  const lines = markdown.split("\n");
  const titleLine = lines[0] ?? "";
  const titleMatch = titleLine.match(/^#\s+(US-[0-9-]+):\s+(.+)$/);
  if (!titleMatch) return null;

  const id = titleMatch[1];
  const title = titleMatch[2];

  const statusLine = lines.find((l) => l.startsWith("**Status:**")) ?? "";
  const status = statusLine.replace("**Status:**", "").trim();

  const storyIndex = lines.findIndex((l) => l.trim() === "## Story");
  let narrative = null;
  if (storyIndex !== -1) {
    for (let i = storyIndex + 1; i < lines.length; i += 1) {
      const line = lines[i];
      if (line.trim().length === 0) continue;
      if (line.trim() === "---") continue;
      if (line.trim().startsWith("## ")) break;
      narrative = line.trim();
      break;
    }
  }

  const criteria = [];
  const criteriaIndex = lines.findIndex(
    (l) => l.trim() === "## Acceptance Criteria",
  );
  if (criteriaIndex !== -1) {
    let current = null;
    for (let i = criteriaIndex + 1; i < lines.length; i += 1) {
      const line = lines[i];
      if (line.trim() === "---") break;
      if (line.trim().startsWith("## ")) break;

      if (line.trim().startsWith("### ")) {
        if (current) criteria.push(current);
        current = { title: line.trim().replace(/^###\s+/, ""), bullets: [] };
        continue;
      }

      if (current && line.trim().startsWith("- ")) {
        current.bullets.push(line.trim().replace(/^-\s+/, ""));
      }
    }
    if (current) criteria.push(current);
  }

  const edgeCaseIndex = lines.findIndex((l) => l.trim() === "## Edge Cases");
  let edgeCasesTable = null;
  if (edgeCaseIndex !== -1) {
    const tableLines = [];
    for (let i = edgeCaseIndex + 1; i < lines.length; i += 1) {
      const line = lines[i];
      if (line.trim() === "---") break;
      if (line.trim().startsWith("## ")) break;
      if (line.trim().length === 0) continue;
      tableLines.push(line);
    }

    const table = parseMarkdownTable(tableLines);
    if (table) edgeCasesTable = table;
  }

  const formFieldsIndex = lines.findIndex((l) =>
    l.trim().startsWith("## Form Fields"),
  );
  let formFieldsTable = null;
  if (formFieldsIndex !== -1) {
    const tableLines = [];
    for (let i = formFieldsIndex + 1; i < lines.length; i += 1) {
      const line = lines[i];
      if (line.trim() === "---") break;
      if (line.trim().startsWith("## ")) break;
      if (line.trim().length === 0) continue;
      tableLines.push(line);
    }

    const table = parseMarkdownTable(tableLines);
    if (table) formFieldsTable = table;
  }

  return {
    id,
    title,
    status,
    narrative,
    criteria,
    edgeCasesTable,
    formFieldsTable,
  };
}

function renderCriterion(criterion) {
  const bullets = criterion.bullets
    .map((b) => {
      const trimmed = b.trim();
      const match = trimmed.match(/^(Given|When|Then|And)\s+(.*)$/);
      if (!match) return renderInline(trimmed);
      const [, keyword, rest] = match;
      return `<strong>${escapeHtml(keyword)}</strong> ${renderInline(rest)}`;
    })
    .join("<br />");

  return (
    `<div class="criterion">` +
    `<div class="criterion-title">${renderInline(criterion.title)}</div>` +
    `<div class="criterion-description">${bullets}</div>` +
    `</div>`
  );
}

function renderStoryCard(story) {
  const statusClass = statusToClass(story.status);
  const narrative = story.narrative ? renderInline(story.narrative) : "";

  const criteriaHtml = story.criteria.length
    ? `<div class="criteria-section">` +
      `<h4>Acceptance Criteria</h4>` +
      story.criteria.map(renderCriterion).join("\n") +
      `</div>`
    : "";

  const edgeCasesHtml = story.edgeCasesTable
    ? `<h4>Edge Cases</h4>${renderTable(story.edgeCasesTable)}`
    : "";

  const formFieldsHtml = story.formFieldsTable
    ? `<h4>Form Fields</h4>${renderTable(story.formFieldsTable)}`
    : "";

  return `
<div class="story-card" id="${slugify(story.id)}">
  <div class="story-header">
    <span class="story-id">${escapeHtml(story.id)}</span>
    <span class="story-status ${statusClass}">${escapeHtml(story.status)}</span>
  </div>
  <div class="story-title">${renderInline(story.title)}</div>
  ${narrative ? `<div class="story-narrative">${narrative}</div>` : ""}
  ${criteriaHtml}
  ${edgeCasesHtml}
  ${formFieldsHtml}
</div>`;
}

function readTextSafe(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function buildHtml({
  baseCss,
  checkpoint,
  derivedCards,
  domains,
  storyCards,
  tocItems,
  executiveSummaryHtml,
}) {
  const tocHtml = tocItems
    .map((item) => {
      const title = escapeHtml(item.title);
      const note = item.note
        ? `<span class="small-muted">${escapeHtml(item.note)}</span>`
        : `<span class="small-muted">—</span>`;
      return `<div class="toc-item"><span class="toc-item-title">${title}</span>${note}</div>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>KudosCourts · User Stories · Checkpoint ${escapeHtml(checkpoint.checkpointNumber)}</title>
    <style>
${baseCss}
    </style>
  </head>
  <body>
    <div class="cover-page">
      <div class="cover-title">KudosCourts</div>
      <div class="cover-subtitle">User Stories &amp; Product Requirements</div>
      <div class="cover-meta">
        <div class="cover-meta-item"><span class="cover-meta-label">Checkpoint:</span> ${escapeHtml(checkpoint.checkpointNumber)}</div>
        <div class="cover-meta-item"><span class="cover-meta-label">Date:</span> ${escapeHtml(checkpoint.date)}</div>
        <div class="cover-meta-item"><span class="cover-meta-label">Total:</span> ${escapeHtml(String(checkpoint.storiesTable.length))} stories</div>
        <div class="cover-meta-item"><span class="cover-meta-label">Status:</span> ${escapeHtml(checkpoint.statusSummary)}</div>
      </div>
      <div class="footer-note">Generated from \`agent-plans/user-stories/checkpoint-${escapeHtml(checkpoint.checkpointNumber)}.md\`</div>
    </div>

    <div class="toc">
      <div class="toc-title">Table of Contents</div>
      ${tocHtml}
    </div>

    <h1>Executive Summary</h1>
    ${executiveSummaryHtml}

    <div class="summary-stats">
      <div class="stat-card"><div class="stat-number">${escapeHtml(String(checkpoint.storiesTable.length))}</div><div class="stat-label">Total Stories</div></div>
      <div class="stat-card"><div class="stat-number">${escapeHtml(String(checkpoint.statusCounts.active))}</div><div class="stat-label">Active</div></div>
      <div class="stat-card"><div class="stat-number">${escapeHtml(String(checkpoint.statusCounts.other))}</div><div class="stat-label">Deferred/Superseded</div></div>
    </div>

    <h1>Checkpoint ${escapeHtml(checkpoint.checkpointNumber)} Overview</h1>

    <h3>Stories in This Checkpoint</h3>
    ${checkpoint.storiesTableHtml}

    ${checkpoint.keyDecisions.length ? `<h3>Key Decisions</h3><div class="info-box">${renderBullets(checkpoint.keyDecisions.map((d) => `- ${d}`))}</div>` : ""}

    ${checkpoint.planDeltasHtml}

    ${derivedCards}
 
    ${domains}

    ${storyCards}

    <div class="footer-note">KudosCourts · Checkpoint ${escapeHtml(checkpoint.checkpointNumber)}</div>
  </body>
</html>`;
}

function main() {
  const args = parseArgs(process.argv);

  const scriptDir = __dirname;
  const rootDir = path.resolve(scriptDir, "..", "..");

  const checkpointNumber = args.checkpoint ?? "07";
  const checkpointPath = args.checkpointPath
    ? path.resolve(process.cwd(), args.checkpointPath)
    : path.join(scriptDir, `checkpoint-${checkpointNumber}.md`);

  const baseHtmlPath = args.baseHtmlPath
    ? path.resolve(process.cwd(), args.baseHtmlPath)
    : path.join(scriptDir, "user-stories-document.html");

  const outHtmlPath = args.outHtmlPath
    ? path.resolve(process.cwd(), args.outHtmlPath)
    : path.join(
        scriptDir,
        `user-stories-document-checkpoint-${checkpointNumber}.html`,
      );

  if (!fs.existsSync(checkpointPath)) {
    throw new Error(`Checkpoint markdown not found: ${checkpointPath}`);
  }

  if (!fs.existsSync(baseHtmlPath)) {
    throw new Error(`Base HTML template not found: ${baseHtmlPath}`);
  }

  const baseHtml = readTextSafe(baseHtmlPath);
  const baseCss = extractTagContents(baseHtml, "style");
  if (!baseCss) {
    throw new Error(`Could not extract <style> from ${baseHtmlPath}`);
  }

  const checkpointMarkdown = readTextSafe(checkpointPath);
  const checkpoint = parseCheckpointMarkdown(checkpointMarkdown);

  const statusCounts = checkpoint.storiesTable.reduce(
    (acc, row) => {
      const normalized = row.status.toLowerCase();
      if (normalized.includes("active")) acc.active += 1;
      else acc.other += 1;
      return acc;
    },
    { active: 0, other: 0 },
  );

  const statusSummary = checkpoint.storiesTable.reduce(
    (acc, row) => {
      const normalized = row.status.toLowerCase();
      if (normalized.includes("active")) acc.active += 1;
      else if (normalized.includes("superseded")) acc.superseded += 1;
      else if (normalized.includes("deferred")) acc.deferred += 1;
      else if (normalized.includes("fixed")) acc.fixed += 1;
      else acc.other += 1;
      return acc;
    },
    { active: 0, superseded: 0, deferred: 0, fixed: 0, other: 0 },
  );

  const statusSummaryParts = [
    `${statusSummary.active} Active`,
    `${statusSummary.superseded} Superseded`,
    `${statusSummary.deferred} Deferred`,
    `${statusSummary.fixed} Fixed`,
  ];

  const storiesTableHtml = (() => {
    const header = `<thead><tr><th>ID</th><th>Domain</th><th>Story</th><th>Status</th></tr></thead>`;
    const rows = checkpoint.storiesTable
      .map(
        (r) =>
          `<tr><td>${escapeHtml(r.id)}</td><td>${escapeHtml(r.domain)}</td><td>${escapeHtml(r.story)}</td><td>${escapeHtml(r.status)}</td></tr>`,
      )
      .join("\n");
    return `<table>${header}<tbody>${rows}</tbody></table>`;
  })();

  const planDeltasHtml = (() => {
    if (checkpoint.planDeltas.length === 0) return "";
    const header = `<thead><tr><th>Plan</th><th>Theme</th></tr></thead>`;
    const rows = checkpoint.planDeltas
      .map(
        (d) =>
          `<tr><td><code>${escapeHtml(d.planPath)}</code></td><td>${renderInline(d.theme)}</td></tr>`,
      )
      .join("\n");
    return `
<h3>Agent Plan Deltas (Non-story Fixes / Standardization)</h3>
<table>${header}<tbody>${rows}</tbody></table>`;
  })();

  const executiveSummaryHtml = (() => {
    const textLines = checkpoint.summary.filter(
      (l) => !l.trim().startsWith("- "),
    );
    const bulletLines = checkpoint.summary.filter((l) =>
      l.trim().startsWith("- "),
    );

    const p = textLines.length
      ? `<p>${renderInline(textLines.join(" "))}</p>`
      : "";

    const bullets = bulletLines.length ? renderBullets(bulletLines) : "";

    return `${p}${bullets}`;
  })();

  const userStoriesRoot = path.join(rootDir, "agent-plans", "user-stories");

  const storiesWithPaths = checkpoint.storiesTable.map((row) => {
    const storyPath = findStoryFileById(userStoriesRoot, row.id);
    if (!storyPath) {
      throw new Error(`Could not find story file for ${row.id}`);
    }
    return { ...row, storyPath };
  });

  const parsedStories = storiesWithPaths.map((row) => {
    const content = readTextSafe(row.storyPath);
    const parsed = parseStoryMarkdown(content);
    if (!parsed) {
      throw new Error(`Could not parse story markdown: ${row.storyPath}`);
    }
    return { ...parsed, domain: row.domain, storyPath: row.storyPath };
  });

  const tocItems = [];
  tocItems.push({ title: "Executive Summary", note: "—" });
  tocItems.push({
    title: `Checkpoint ${checkpoint.checkpointNumber} Overview`,
    note: "—",
  });

  const derivedPlanStories = checkpoint.planDeltas
    .map((delta) => {
      const absolutePlanPath = path.join(rootDir, delta.planPath);
      if (!fs.existsSync(absolutePlanPath)) return null;
      const planMarkdown = readTextSafe(absolutePlanPath);
      return parsePlanMarkdownForDerived({
        planMarkdown,
        planPath: delta.planPath,
        theme: delta.theme,
      });
    })
    .filter(Boolean);

  const derivedCardsHtml = derivedPlanStories.length
    ? `\n<h1>Derived Engineering Stories</h1>\n` +
      `<p class="small-muted">Derived from referenced agent plans in this checkpoint.</p>` +
      derivedPlanStories.map(renderStoryCard).join("\n")
    : "";

  if (derivedPlanStories.length) {
    tocItems.push({
      title: "Derived Engineering Stories (from Agent Plans)",
      note: "—",
    });
    for (const derived of derivedPlanStories) {
      tocItems.push({ title: `${derived.id} · ${derived.title}`, note: "—" });
    }
  }

  const storiesByDomain = new Map();
  for (const story of parsedStories) {
    const existing = storiesByDomain.get(story.domain) ?? [];
    existing.push(story);
    storiesByDomain.set(story.domain, existing);
  }

  const domainSectionsHtml = Array.from(storiesByDomain.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([domain, stories]) => {
      tocItems.push({ title: `Domain: ${domain}`, note: "—" });
      for (const story of stories) {
        tocItems.push({ title: `${story.id} · ${story.title}`, note: "—" });
      }

      const domainDir = path.join(userStoriesRoot, domain);
      const overviewPath = findDomainOverview(domainDir);
      const overviewText = overviewPath
        ? extractOverviewText(readTextSafe(overviewPath))
        : null;

      const overviewBlock = overviewText
        ? `<div class="domain-overview"><h3>Overview</h3><p>${renderInline(overviewText)}</p></div>`
        : "";

      return `
<div class="domain-section">
  <h1>Domain: ${escapeHtml(domain)}</h1>
  ${overviewBlock}
</div>`;
    })
    .join("\n");

  const storyCardsHtml = parsedStories.map(renderStoryCard).join("\n");

  const html = buildHtml({
    baseCss,
    checkpoint: {
      ...checkpoint,
      statusCounts,
      statusSummary: statusSummaryParts.join(" · "),
      storiesTableHtml,
      planDeltasHtml,
    },
    derivedCards: derivedCardsHtml,
    domains: domainSectionsHtml,
    storyCards: storyCardsHtml,
    tocItems,
    executiveSummaryHtml,
  });

  fs.writeFileSync(outHtmlPath, html, "utf8");
  process.stdout.write(outHtmlPath);
}

main();
