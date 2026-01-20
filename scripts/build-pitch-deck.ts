import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

type ListType = "ul" | "ol";

type ListFrame = {
  type: ListType;
  indent: number;
  hasOpenLi: boolean;
};

function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function renderInline(text: string) {
  const parts = text.split("`");

  return parts
    .map((part, idx) => {
      const escaped = escapeHtml(part);

      if (idx % 2 === 1) {
        return `<code>${escaped}</code>`;
      }

      return escaped;
    })
    .join("");
}

function markdownToHtml(markdown: string) {
  const lines = markdown.replaceAll("\r\n", "\n").split("\n");

  const out: string[] = [];
  const listStack: ListFrame[] = [];

  let paragraph: string[] = [];

  const flushParagraph = () => {
    const text = paragraph.join(" ").trim();
    if (!text) {
      paragraph = [];
      return;
    }

    out.push(`<p>${renderInline(text)}</p>`);
    paragraph = [];
  };

  const closeOneList = () => {
    const frame = listStack.pop();
    if (!frame) return;

    if (frame.hasOpenLi) {
      out.push("</li>");
    }

    out.push(`</${frame.type}>`);

    if (listStack.length > 0) {
      // We are returning to a parent list item context.
    }
  };

  const closeAllLists = () => {
    while (listStack.length > 0) {
      closeOneList();
    }
  };

  const ensureList = (type: ListType, indent: number) => {
    if (listStack.length === 0) {
      out.push(`<${type}>`);
      listStack.push({ type, indent, hasOpenLi: false });
      return;
    }

    const top = listStack[listStack.length - 1];

    if (indent > top.indent) {
      // Nested list inside the current open list item.
      out.push(`<${type}>`);
      listStack.push({ type, indent, hasOpenLi: false });
      return;
    }

    while (
      listStack.length > 0 &&
      indent < listStack[listStack.length - 1].indent
    ) {
      closeOneList();
    }

    const current = listStack[listStack.length - 1];
    if (!current) {
      out.push(`<${type}>`);
      listStack.push({ type, indent, hasOpenLi: false });
      return;
    }

    if (current.indent === indent && current.type !== type) {
      closeOneList();
      out.push(`<${type}>`);
      listStack.push({ type, indent, hasOpenLi: false });
    }
  };

  const startListItem = (type: ListType, indent: number, content: string) => {
    flushParagraph();

    ensureList(type, indent);

    const frame = listStack[listStack.length - 1];
    if (!frame) return;

    if (frame.hasOpenLi) {
      out.push("</li>");
      frame.hasOpenLi = false;
    }

    out.push(`<li>${renderInline(content)}`);
    frame.hasOpenLi = true;
  };

  for (const rawLine of lines) {
    const line = rawLine.replaceAll("\t", "  ");

    const headingMatch = /^(#{1,6})\s+(.*)$/.exec(line);
    if (headingMatch) {
      flushParagraph();
      closeAllLists();

      const level = headingMatch[1]?.length ?? 1;
      const text = headingMatch[2] ?? "";

      out.push(`<h${level}>${renderInline(text.trim())}</h${level}>`);
      continue;
    }

    const bulletMatch = /^(\s*)[-*]\s+(.*)$/.exec(line);
    if (bulletMatch) {
      const indent = bulletMatch[1]?.length ?? 0;
      const content = (bulletMatch[2] ?? "").trim();
      startListItem("ul", indent, content);
      continue;
    }

    const orderedMatch = /^(\s*)\d+\.\s+(.*)$/.exec(line);
    if (orderedMatch) {
      const indent = orderedMatch[1]?.length ?? 0;
      const content = (orderedMatch[2] ?? "").trim();
      startListItem("ol", indent, content);
      continue;
    }

    if (line.trim() === "") {
      flushParagraph();
      closeAllLists();
      continue;
    }

    // Non-list text.
    closeAllLists();
    paragraph.push(line.trim());
  }

  flushParagraph();
  closeAllLists();

  return out.join("\n");
}

function buildHtml(slideSections: string) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>KudosCourts Pitch Deck</title>
    <style>
      @page {
        size: 13.333in 7.5in;
        margin: 0;
      }

      :root {
        --bg: #ffffff;
        --text: #0f172a;
        --muted: #475569;
        --teal: #0d9488;
        --orange: #f97316;
        --border: #e2e8f0;
      }

      html,
      body {
        height: 100%;
      }

      body {
        margin: 0;
        background: var(--bg);
        color: var(--text);
        font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, "Apple Color Emoji",
          "Segoe UI Emoji";
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      body {
        counter-reset: slide;
      }

      .slide {
        position: relative;
        box-sizing: border-box;
        width: 100%;
        height: 100%;
        padding: 0.85in 0.95in;
        overflow: hidden;
        break-after: page;
        page-break-after: always;
        counter-increment: slide;
      }

      .slide:last-child {
        break-after: auto;
        page-break-after: auto;
      }

      .slide::after {
        content: counter(slide);
        position: absolute;
        right: 0.5in;
        bottom: 0.35in;
        color: var(--muted);
        font-size: 12px;
      }

      h1 {
        font-size: 56px;
        line-height: 1.05;
        letter-spacing: -0.02em;
        margin: 0 0 0.35in;
      }

      h2 {
        font-size: 40px;
        line-height: 1.1;
        letter-spacing: -0.02em;
        margin: 0 0 0.25in;
      }

      h3 {
        font-size: 28px;
        line-height: 1.15;
        margin: 0 0 0.2in;
      }

      p {
        margin: 0 0 0.18in;
        font-size: 22px;
        line-height: 1.35;
        color: var(--text);
      }

      ul,
      ol {
        margin: 0 0 0.18in;
        padding-left: 1.1em;
        font-size: 22px;
        line-height: 1.35;
      }

      li {
        margin: 0.07in 0;
      }

      code {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New",
          monospace;
        font-size: 0.95em;
        background: #f1f5f9;
        border: 1px solid var(--border);
        padding: 0.08em 0.3em;
        border-radius: 6px;
      }

      .accent {
        color: var(--orange);
      }

      .primary {
        color: var(--teal);
      }

      hr {
        border: none;
        border-top: 1px solid var(--border);
        margin: 0.25in 0;
      }
    </style>
  </head>
  <body>
${slideSections}
  </body>
</html>`;
}

function main() {
  const repoRoot = process.cwd();
  const deckDir = path.join(repoRoot, "docs", "pitch-deck");

  if (!fs.existsSync(deckDir)) {
    throw new Error(`Pitch deck directory not found: ${deckDir}`);
  }

  const mdFiles = fs
    .readdirSync(deckDir)
    .filter((f) => /^\d\d-.*\.md$/.test(f))
    .sort();

  if (mdFiles.length === 0) {
    throw new Error(`No slide markdown files found in: ${deckDir}`);
  }

  const buildDir = path.join(deckDir, "_build");
  fs.mkdirSync(buildDir, { recursive: true });

  const sections = mdFiles
    .map((file) => {
      const md = fs.readFileSync(path.join(deckDir, file), "utf8");
      const content = markdownToHtml(md);
      return `  <section class="slide" data-file="${escapeHtml(file)}">\n${content}\n  </section>`;
    })
    .join("\n");

  const html = buildHtml(sections);

  const htmlPath = path.join(buildDir, "pitch-deck.html");
  fs.writeFileSync(htmlPath, html, "utf8");

  const pdfPath = path.join(deckDir, "kudoscourts-pitch-deck.pdf");

  const chromePath =
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  if (!fs.existsSync(chromePath)) {
    throw new Error(
      `Google Chrome not found at: ${chromePath}. Install Chrome, or update the script to use your browser path.`,
    );
  }

  const url = pathToFileURL(htmlPath).href;

  const result = spawnSync(
    chromePath,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-extensions",
      "--print-to-pdf-no-header",
      `--print-to-pdf=${pdfPath}`,
      url,
    ],
    { stdio: "inherit" },
  );

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  console.log(`\nWrote PDF: ${pdfPath}`);
  console.log(`Wrote HTML: ${htmlPath}`);
}

main();
