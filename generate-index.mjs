#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, extname, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_IGNORES = new Set([
  ".git",
  ".github",
  ".next",
  ".nuxt",
  ".cache",
  ".vercel",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "outputs",
  "pdfs",
  "vendor",
  "work",
  "__pycache__",
]);

const SUPPORTED_EXTENSIONS = new Set([".html", ".htm", ".md", ".markdown"]);

function parseArgs(argv) {
  const args = {
    root: process.cwd(),
    out: "index.html",
    title: "Public docs",
    extra: [],
    pdfs: true,
    pdfDir: "pdfs",
    chrome: process.env.CHROME_PATH || "",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--root") args.root = argv[++index];
    else if (arg === "--out") args.out = argv[++index];
    else if (arg === "--title") args.title = argv[++index];
    else if (arg === "--extra") args.extra.push(argv[++index]);
    else if (arg === "--pdf-dir") args.pdfDir = argv[++index];
    else if (arg === "--chrome") args.chrome = argv[++index];
    else if (arg === "--skip-pdfs") args.pdfs = false;
    else if (arg === "--help" || arg === "-h") {
      console.log("Usage: node generate-index.mjs [--root repo-root] [--out index.html] [--title \"Public docs\"] [--pdf-dir pdfs] [--chrome /path/to/chrome] [--skip-pdfs] [--extra /abs/file.html:repo/path.html]");
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  args.root = resolve(args.root);
  args.out = resolve(args.root, args.out);
  args.pdfDir = toPosixPath(args.pdfDir).replace(/^\/+/, "").replace(/\/+$/, "") || "pdfs";
  return args;
}

function toPosixPath(pathValue) {
  return pathValue.split(sep).join("/");
}

function isSupportedFile(filePath) {
  return SUPPORTED_EXTENSIONS.has(extname(filePath).toLowerCase());
}

function walk(dir, root, outFile, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") && entry.name !== ".well-known") continue;
    if (entry.isDirectory()) {
      if (DEFAULT_IGNORES.has(entry.name)) continue;
      walk(join(dir, entry.name), root, outFile, files);
      continue;
    }

    if (!entry.isFile()) continue;

    const filePath = join(dir, entry.name);
    if (!isSupportedFile(filePath)) continue;
    if (resolve(filePath) === resolve(outFile)) continue;
    files.push(filePath);
  }

  return files;
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function stripMarkdown(markdown) {
  return markdown
    .replace(/^---[\s\S]*?---\s*/m, "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/[*_~#>-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function smartTitleFromPath(filePath) {
  const name = basename(filePath, extname(filePath));
  if (name.toLowerCase() === "index") return basename(dirname(filePath));
  return name
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function extractTitle(content, filePath, type) {
  if (type === "html") {
    const titleMatch = content.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleMatch && stripHtml(titleMatch[1])) return stripHtml(titleMatch[1]).slice(0, 120);

    const headingMatch = content.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (headingMatch && stripHtml(headingMatch[1])) return stripHtml(headingMatch[1]).slice(0, 120);
  }

  const markdownHeading = content.match(/^#\s+(.+)$/m);
  if (markdownHeading) return markdownHeading[1].trim().slice(0, 120);

  return smartTitleFromPath(filePath);
}

function excerpt(text, maxLength = 260) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, maxLength - 1).replace(/\s+\S*$/, "")}...`;
}

function classifyType(filePath) {
  const extension = extname(filePath).toLowerCase();
  if (extension === ".html" || extension === ".htm") return "html";
  return "markdown";
}

function parseExtra(extraValue) {
  const splitIndex = extraValue.indexOf(":");
  if (splitIndex === -1) {
    return { source: resolve(extraValue), href: basename(extraValue) };
  }

  return {
    source: resolve(extraValue.slice(0, splitIndex)),
    href: toPosixPath(extraValue.slice(splitIndex + 1)),
  };
}

function fileRecord({ filePath, root, hrefOverride = null }) {
  const content = readFileSync(filePath, "utf8");
  const type = classifyType(filePath);
  const href = hrefOverride || encodeURI(toPosixPath(relative(root, filePath)));
  const rawText = type === "html" ? stripHtml(content) : stripMarkdown(content);
  const stats = statSync(filePath);
  const title = extractTitle(content, filePath, type);
  const folderPath = toPosixPath(dirname(href));
  const folder = folderPath === "." ? "Root" : folderPath;

  const record = {
    title,
    href,
    path: decodeURI(href),
    folder,
    type,
    excerpt: excerpt(rawText),
    searchText: `${title} ${decodeURI(href)} ${folder} ${rawText}`.toLowerCase(),
    updated: stats.mtime.toISOString().slice(0, 10),
  };

  Object.defineProperty(record, "sourcePath", {
    value: filePath,
    enumerable: false,
  });

  return record;
}

function buildManifest(args) {
  const files = walk(args.root, args.root, args.out);
  const records = files.map((filePath) => fileRecord({ filePath, root: args.root }));

  for (const extra of args.extra.map(parseExtra)) {
    if (!existsSync(extra.source)) {
      console.warn(`Skipping missing extra file: ${extra.source}`);
      continue;
    }
    records.push(fileRecord({ filePath: extra.source, root: dirname(extra.source), hrefOverride: extra.href }));
  }

  records.sort((left, right) => {
    const folderSort = left.folder.localeCompare(right.folder);
    if (folderSort !== 0) return folderSort;
    return left.title.localeCompare(right.title);
  });

  return records;
}

function findChrome(explicitPath) {
  const candidates = [
    explicitPath,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }

  for (const command of ["google-chrome", "chromium", "chromium-browser", "chrome"]) {
    try {
      return execFileSync("which", [command], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    } catch {
      // Keep searching.
    }
  }

  return "";
}

function pdfHrefFor(record, pdfDir) {
  const decodedPath = decodeURI(record.href).replace(/\\/g, "/");
  const withoutExtension = decodedPath.replace(/\.[^/.]+$/, "");
  return encodeURI(toPosixPath(join(pdfDir, `${withoutExtension}.pdf`)));
}

function markdownToHtml(markdown) {
  const withoutFrontMatter = markdown.replace(/^---[\s\S]*?---\s*/m, "");
  const lines = withoutFrontMatter.split(/\r?\n/);
  const output = [];
  let inCode = false;
  let codeLines = [];
  let listItems = [];
  let paragraph = [];

  function inline(value) {
    return escapeHtml(value)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  }

  function flushList() {
    if (listItems.length === 0) return;
    output.push("<ul>");
    for (const item of listItems) output.push(`<li>${inline(item)}</li>`);
    output.push("</ul>");
    listItems = [];
  }

  function flushParagraph() {
    if (paragraph.length === 0) return;
    output.push(`<p>${inline(paragraph.join(" "))}</p>`);
    paragraph = [];
  }

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      if (inCode) {
        output.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
        codeLines = [];
        inCode = false;
      } else {
        flushParagraph();
        flushList();
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      const level = Math.min(heading[1].length, 4);
      output.push(`<h${level}>${inline(heading[2].trim())}</h${level}>`);
      continue;
    }

    const bullet = line.match(/^\s*[-*]\s+(.+)$/);
    if (bullet) {
      flushParagraph();
      listItems.push(bullet[1].trim());
      continue;
    }

    if (line.trim() === "") {
      flushParagraph();
      flushList();
      continue;
    }

    flushList();
    paragraph.push(line.trim());
  }

  flushParagraph();
  flushList();

  if (inCode) output.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
  return output.join("\n");
}

function markdownPrintPage(record) {
  const markdown = readFileSync(record.sourcePath, "utf8");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(record.title)}</title>
  <style>
    :root {
      color: #17191f;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    body {
      max-width: 760px;
      margin: 0 auto;
      padding: 44px 36px;
      line-height: 1.58;
    }

    h1, h2, h3, h4 {
      line-height: 1.16;
      margin: 1.5em 0 0.45em;
    }

    h1 {
      font-size: 34px;
      margin-top: 0;
    }

    h2 {
      font-size: 25px;
      border-top: 1px solid #d7dce3;
      padding-top: 18px;
    }

    p, li {
      font-size: 14px;
    }

    a {
      color: #2b74c8;
    }

    code {
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
      font-size: 0.92em;
      background: #eef1f5;
      border-radius: 4px;
      padding: 0.1em 0.28em;
    }

    pre {
      padding: 14px;
      overflow-wrap: anywhere;
      white-space: pre-wrap;
      background: #f6f7f9;
      border: 1px solid #d7dce3;
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <main>
    ${markdownToHtml(markdown)}
  </main>
</body>
</html>`;
}

function renderPdf(chromePath, url, outputPath) {
  mkdirSync(dirname(outputPath), { recursive: true });
  execFileSync(chromePath, [
    "--headless",
    "--disable-gpu",
    "--no-sandbox",
    "--allow-file-access-from-files",
    "--print-to-pdf-no-header",
    `--print-to-pdf=${outputPath}`,
    url,
  ], { stdio: "ignore" });
}

function generatePdfs(args, records) {
  if (!args.pdfs) return;

  const chromePath = findChrome(args.chrome);
  if (!chromePath) {
    console.warn("PDF generation skipped: Chrome or Chromium was not found. Use --chrome /path/to/chrome or --skip-pdfs.");
    return;
  }

  const tempDir = mkdtempSync(join(tmpdir(), "public-index-pdfs-"));

  try {
    for (const record of records) {
      const pdfHref = pdfHrefFor(record, args.pdfDir);
      const pdfPath = resolve(args.root, decodeURI(pdfHref));
      record.pdfHref = pdfHref;

      if (record.type === "html") {
        renderPdf(chromePath, pathToFileURL(record.sourcePath).href, pdfPath);
        continue;
      }

      const tempHtml = join(tempDir, `${basename(record.sourcePath)}.html`);
      writeFileSync(tempHtml, markdownPrintPage(record));
      renderPdf(chromePath, pathToFileURL(tempHtml).href, pdfPath);
    }
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

function safeJson(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function renderHtml({ title, records }) {
  const json = safeJson(records);
  const htmlCount = records.filter((record) => record.type === "html").length;
  const markdownCount = records.filter((record) => record.type === "markdown").length;
  const pdfCount = records.filter((record) => record.pdfHref).length;
  const folderCount = new Set(records.map((record) => record.folder)).size;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f6f7f9;
      --surface: #ffffff;
      --surface-2: #eef1f5;
      --text: #17191f;
      --muted: #667085;
      --line: #d7dce3;
      --blue: #2b74c8;
      --green: #247b5a;
      --orange: #a85c18;
      --shadow: 0 12px 34px rgba(28, 36, 48, 0.10);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      min-height: 100vh;
      color: var(--text);
      background:
        linear-gradient(180deg, rgba(43, 116, 200, 0.08), transparent 260px),
        var(--bg);
    }

    a {
      color: inherit;
    }

    button,
    input {
      font: inherit;
    }

    .shell {
      max-width: 1240px;
      margin: 0 auto;
      padding: 28px 20px 44px;
    }

    .masthead {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: end;
      gap: 20px;
      margin-bottom: 22px;
    }

    h1 {
      margin: 0;
      font-size: clamp(30px, 5vw, 56px);
      line-height: 0.96;
      letter-spacing: 0;
    }

    .summary {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .metric {
      min-width: 96px;
      padding: 10px 12px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.82);
      text-align: right;
    }

    .metric strong {
      display: block;
      font-size: 18px;
      line-height: 1.1;
    }

    .metric span {
      color: var(--muted);
      font-size: 12px;
    }

    .toolbar {
      display: grid;
      grid-template-columns: minmax(260px, 1fr) auto;
      align-items: center;
      gap: 12px;
      margin-bottom: 22px;
      position: sticky;
      top: 0;
      z-index: 20;
      padding: 12px 0;
      background: rgba(246, 247, 249, 0.88);
      backdrop-filter: blur(14px);
    }

    .search {
      display: grid;
      grid-template-columns: 22px minmax(0, 1fr);
      align-items: center;
      gap: 8px;
      min-height: 44px;
      padding: 0 14px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--surface);
      box-shadow: 0 1px 0 rgba(17, 24, 39, 0.03);
    }

    .search svg {
      color: var(--muted);
    }

    .search input {
      border: 0;
      outline: 0;
      min-width: 0;
      color: var(--text);
      background: transparent;
    }

    .filters {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--surface);
    }

    .filter {
      min-width: 82px;
      height: 34px;
      padding: 0 12px;
      border: 0;
      border-radius: 6px;
      background: transparent;
      color: var(--muted);
      cursor: pointer;
    }

    .filter[aria-pressed="true"] {
      color: var(--text);
      background: var(--surface-2);
    }

    .results-line {
      min-height: 22px;
      margin: 0 0 14px;
      color: var(--muted);
      font-size: 14px;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    }

    .card {
      min-width: 0;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--surface);
      box-shadow: var(--shadow);
      overflow: hidden;
      display: grid;
      grid-template-rows: 190px minmax(0, auto);
    }

    .preview {
      position: relative;
      background:
        linear-gradient(135deg, rgba(36, 123, 90, 0.14), transparent 46%),
        linear-gradient(315deg, rgba(168, 92, 24, 0.12), transparent 42%),
        #f8fafc;
      border-bottom: 1px solid var(--line);
      overflow: hidden;
    }

    .preview iframe {
      width: 100%;
      height: 100%;
      border: 0;
      background: white;
      transform: scale(0.72);
      transform-origin: top left;
      width: 138.888%;
      height: 138.888%;
      pointer-events: none;
    }

    .markdown-preview {
      height: 100%;
      padding: 18px;
      overflow: hidden;
      color: #263241;
    }

    .markdown-preview .doc-line {
      width: 58px;
      height: 4px;
      margin-bottom: 14px;
      border-radius: 999px;
      background: var(--green);
    }

    .markdown-preview p {
      margin: 0;
      font-size: 14px;
      line-height: 1.48;
    }

    .body {
      min-width: 0;
      padding: 15px;
    }

    .meta {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
      color: var(--muted);
      font-size: 12px;
    }

    .type {
      color: #fff;
      border-radius: 999px;
      padding: 3px 8px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .type.html {
      background: var(--blue);
    }

    .type.markdown {
      background: var(--green);
    }

    .card h2 {
      margin: 0 0 8px;
      font-size: 18px;
      line-height: 1.2;
      letter-spacing: 0;
    }

    .path {
      margin: 0 0 13px;
      color: var(--muted);
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
      font-size: 12px;
      line-height: 1.35;
      overflow-wrap: anywhere;
    }

    .actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .action-links {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .open-link,
    .pdf-link {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      min-height: 36px;
      padding: 0 12px;
      border-radius: 7px;
      background: #17191f;
      color: #fff;
      text-decoration: none;
      font-weight: 650;
      font-size: 14px;
    }

    .pdf-link {
      border: 1px solid var(--line);
      background: var(--surface);
      color: var(--text);
    }

    .open-link:hover,
    .open-link:focus-visible {
      background: #2b74c8;
      outline: none;
    }

    .pdf-link:hover,
    .pdf-link:focus-visible {
      border-color: #2b74c8;
      color: #2b74c8;
      outline: none;
    }

    .folder {
      min-width: 0;
      color: var(--orange);
      font-size: 12px;
      text-align: right;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .empty {
      display: none;
      border: 1px dashed var(--line);
      border-radius: 8px;
      padding: 36px;
      background: rgba(255, 255, 255, 0.72);
      color: var(--muted);
      text-align: center;
    }

    .empty.is-visible {
      display: block;
    }

    @media (max-width: 760px) {
      .shell {
        padding: 20px 14px 34px;
      }

      .masthead,
      .toolbar {
        grid-template-columns: 1fr;
      }

      .summary {
        justify-content: stretch;
      }

      .metric {
        flex: 1 1 0;
        text-align: left;
      }

      .filters {
        justify-content: stretch;
      }

      .filter {
        flex: 1;
        min-width: 0;
      }

      .grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <main class="shell">
    <header class="masthead">
      <h1>${escapeHtml(title)}</h1>
      <div class="summary" aria-label="Index summary">
        <div class="metric"><strong>${records.length}</strong><span>Items</span></div>
        <div class="metric"><strong>${htmlCount}</strong><span>HTML</span></div>
        <div class="metric"><strong>${markdownCount}</strong><span>Markdown</span></div>
        <div class="metric"><strong>${pdfCount}</strong><span>PDFs</span></div>
        <div class="metric"><strong>${folderCount}</strong><span>Folders</span></div>
      </div>
    </header>

    <section class="toolbar" aria-label="Search and filters">
      <label class="search">
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="7"></circle>
          <path d="m20 20-3.5-3.5"></path>
        </svg>
        <input id="search" type="search" autocomplete="off" placeholder="Search titles, paths, folders, and excerpts">
      </label>
      <div class="filters" role="group" aria-label="File type filter">
        <button class="filter" type="button" data-filter="all" aria-pressed="true">All</button>
        <button class="filter" type="button" data-filter="html" aria-pressed="false">HTML</button>
        <button class="filter" type="button" data-filter="markdown" aria-pressed="false">Markdown</button>
      </div>
    </section>

    <p class="results-line" id="resultsLine"></p>
    <section class="grid" id="grid" aria-live="polite"></section>
    <section class="empty" id="empty">No matching files.</section>
  </main>

  <script id="index-data" type="application/json">${json}</script>
  <script>
    const records = JSON.parse(document.getElementById("index-data").textContent);
    const grid = document.getElementById("grid");
    const empty = document.getElementById("empty");
    const searchInput = document.getElementById("search");
    const resultsLine = document.getElementById("resultsLine");
    const filterButtons = Array.from(document.querySelectorAll(".filter"));
    let activeFilter = "all";

    function escapeHtml(value) {
      return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
    }

    function icon() {
      return '<svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17 17 7"></path><path d="M8 7h9v9"></path></svg>';
    }

    function downloadIcon() {
      return '<svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12"></path><path d="m7 10 5 5 5-5"></path><path d="M5 21h14"></path></svg>';
    }

    function card(record) {
      const preview = record.type === "html"
        ? '<iframe src="' + record.href + '" title="Preview of ' + escapeHtml(record.title) + '" loading="lazy"></iframe>'
        : '<div class="markdown-preview"><div class="doc-line"></div><p>' + escapeHtml(record.excerpt || "Markdown document") + '</p></div>';
      const pdfAction = record.pdfHref
        ? '<a class="pdf-link" href="' + record.pdfHref + '" download>' + downloadIcon() + '<span>PDF</span></a>'
        : '';

      return '<article class="card">' +
        '<div class="preview">' + preview + '</div>' +
        '<div class="body">' +
          '<div class="meta"><span class="type ' + record.type + '">' + (record.type === "html" ? "HTML" : "MD") + '</span><span>Updated ' + escapeHtml(record.updated) + '</span></div>' +
          '<h2>' + escapeHtml(record.title) + '</h2>' +
          '<p class="path">' + escapeHtml(record.path) + '</p>' +
          '<div class="actions">' +
            '<div class="action-links">' +
              '<a class="open-link" href="' + record.href + '">' + icon() + '<span>Open</span></a>' +
              pdfAction +
            '</div>' +
            '<span class="folder" title="' + escapeHtml(record.folder) + '">' + escapeHtml(record.folder) + '</span>' +
          '</div>' +
        '</div>' +
      '</article>';
    }

    function matches(record, query) {
      if (activeFilter !== "all" && record.type !== activeFilter) return false;
      if (!query) return true;
      return query.split(/\\s+/).every((part) => record.searchText.includes(part));
    }

    function render() {
      const query = searchInput.value.trim().toLowerCase();
      const filtered = records.filter((record) => matches(record, query));
      grid.innerHTML = filtered.map(card).join("");
      empty.classList.toggle("is-visible", filtered.length === 0);
      const typeLabel = activeFilter === "all" ? "files" : activeFilter === "html" ? "HTML files" : "Markdown files";
      resultsLine.textContent = filtered.length + " of " + records.length + " " + typeLabel;
    }

    filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        activeFilter = button.dataset.filter;
        filterButtons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
        render();
      });
    });

    searchInput.addEventListener("input", render);
    render();
  </script>
</body>
</html>
`;
}

const args = parseArgs(process.argv.slice(2));
const records = buildManifest(args);
generatePdfs(args, records);
writeFileSync(args.out, renderHtml({ title: args.title, records }));
console.log(`Wrote ${args.out}`);
console.log(`Indexed ${records.length} files`);
