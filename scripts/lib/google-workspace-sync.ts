import { execFile } from "child_process";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { promisify } from "util";
import mongoose from "mongoose";
import { getSiteUrl, rewriteLegacyOriginUrl } from "../../src/lib/seo/domain";

const execFileAsync = promisify(execFile);

export const AI_NEWS_ROOT_FOLDER_NAME = "AI News";
export const MASTER_SPREADSHEET_NAME = "AI News - Master Posts Record";
export const POSTS_SHEET_TAB = "Posts_Master";
export const SUMMARY_SHEET_TAB = "Daily_Summary";

export const MASTER_SHEET_HEADERS = [
  "Post #",
  "Published Date (IST)",
  "Published Time (IST)",
  "Published At (ISO)",
  "MongoDB ID",
  "Status",
  "Title",
  "Slug",
  "Live Post URL",
  "Google Doc URL (Content & SEO)",
  "Drive Subfolder URL",
  "Drive Cover Image URL",
  "Drive HTML Backup URL",
  "Drive JSON Record URL",
  "Cloudinary Cover URL",
  "Cover Image Alt",
  "Cover Image Caption",
  "Category",
  "Author",
  "Tags",
  "Excerpt",
  "Word Count",
  "Reading Time (min)",
  "Featured",
  "Locale",
  "SEO Meta Title",
  "SEO Meta Description",
  "SEO Canonical URL",
  "SEO Focus Keyword",
  "SEO Secondary Keywords",
  "SEO OG Title",
  "SEO OG Description",
  "SEO OG Image",
  "SEO Twitter Card",
  "SEO Schema Type",
  "SEO Robots",
  "SEO Sitemap",
  "SEO Score",
  "ZeroGPT AI Score (%)",
  "ZeroGPT Feedback",
  "News Source / Origin",
  "Source Wire URL",
  "Internal Links Count",
  "External Links Count",
  "HTTP Status Verified",
  "Upload Mode",
  "Synced At (IST)",
] as const;

export interface PostSyncInput {
  id: string;
  title: string;
  slug: string;
  status: string;
  excerpt: string;
  contentHtml: string;
  coverImage?: string;
  coverImageAlt?: string;
  coverImageCaption?: string;
  focalPoint?: { x?: number; y?: number };
  authorName?: string;
  categoryName?: string;
  tags?: string[];
  faqs?: Array<{ question: string; answer: string }>;
  readingTime?: number;
  wordCount?: number;
  featured?: boolean;
  allowComments?: boolean;
  locale?: string;
  publishedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    focusKeyword?: string;
    secondaryKeywords?: string[];
    canonicalUrl?: string;
    robots?: {
      index?: boolean;
      follow?: boolean;
      noarchive?: boolean;
      nosnippet?: boolean;
      maxImagePreview?: string;
    };
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    twitterCard?: string;
    schemaType?: string;
    schemaOverrides?: string;
    breadcrumbTitle?: string;
    sitemap?: {
      include?: boolean;
      priority?: number;
      changefreq?: string;
    };
    hreflang?: Array<{ lang: string; url: string }>;
    redirectFrom?: string[];
    seoScore?: number;
    indexNowStatus?: {
      lastPingedAt?: Date | string;
      status?: string;
      message?: string;
    };
  };
  siteUrl?: string;
  imageBuffer?: Buffer;
  zeroGptScore?: number | null;
  zeroGptFeedback?: string;
  newsSource?: string;
  sourceWireUrl?: string;
  httpStatusVerified?: number | string;
  uploadMode?: "Auto Pipeline" | "Site / Manual Sync";
}

export interface WorkspaceContext {
  rootFolderId: string;
  rootFolderUrl: string;
  spreadsheetId: string;
  spreadsheetUrl: string;
  dateFolderCache: Map<string, string>;
  existingMongoIds: Set<string>;
  existingSlugs: Set<string>;
  nextPostNumber: number;
}

export interface SyncPostResult {
  postId: string;
  slug: string;
  dateFolderName: string;
  rootFolderId: string;
  rootFolderUrl: string;
  dateFolderId: string;
  postFolderId: string;
  postFolderUrl: string;
  docId: string;
  docUrl: string;
  driveCoverUrl: string;
  driveHtmlUrl: string;
  driveJsonUrl: string;
  spreadsheetId: string;
  spreadsheetUrl: string;
  skippedSheetAppend: boolean;
}

type CliToolName = "gdrive" | "gdocs" | "gsheets";

const resolvedBinCache = new Map<CliToolName, { command: string; isCmdShim: boolean }>();

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function resolveCliBinary(tool: CliToolName): Promise<{ command: string; isCmdShim: boolean }> {
  const cached = resolvedBinCache.get(tool);
  if (cached) return cached;

  const envMap: Record<CliToolName, string | undefined> = {
    gdrive: process.env.GDRIVE_CLI_BIN,
    gdocs: process.env.GDOCS_CLI_BIN,
    gsheets: process.env.GSHEETS_CLI_BIN,
  };

  const envOverride = envMap[tool]?.trim();
  if (envOverride && (await fileExists(envOverride))) {
    const res = { command: envOverride, isCmdShim: /\.(cmd|bat)$/i.test(envOverride) };
    resolvedBinCache.set(tool, res);
    return res;
  }

  const homeDir = os.homedir();
  const pluginBinDir = path.join(homeDir, ".gemini", "antigravity", "plugin_data", tool, "bin");
  try {
    const entries = await fs.readdir(pluginBinDir, { withFileTypes: true });
    const candidates = entries
      .filter((e) => e.isFile() && e.name.toLowerCase().startsWith(tool) && !e.name.startsWith("."))
      .map((e) => path.join(pluginBinDir, e.name));

    const preferred =
      process.platform === "win32"
        ? candidates.find((c) => c.toLowerCase().endsWith(".exe")) ?? candidates[0]
        : candidates.find((c) => !c.toLowerCase().endsWith(".exe")) ?? candidates[0];

    if (preferred) {
      const res = { command: preferred, isCmdShim: false };
      resolvedBinCache.set(tool, res);
      return res;
    }
  } catch {
    // continue fallback lookup
  }

  const antigravityShim = path.join(
    homeDir,
    ".gemini",
    "antigravity",
    "bin",
    process.platform === "win32" ? `${tool}.cmd` : tool
  );
  if (await fileExists(antigravityShim)) {
    const res = { command: antigravityShim, isCmdShim: process.platform === "win32" };
    resolvedBinCache.set(tool, res);
    return res;
  }

  const fallback = { command: tool, isCmdShim: process.platform === "win32" };
  resolvedBinCache.set(tool, fallback);
  return fallback;
}

async function runCli(tool: CliToolName, args: string[], attempt = 1): Promise<string> {
  const bin = await resolveCliBinary(tool);
  try {
    const result = bin.isCmdShim
      ? await execFileAsync("cmd.exe", ["/c", bin.command, ...args], {
          maxBuffer: 10 * 1024 * 1024,
          timeout: 90_000,
          windowsHide: true,
        })
      : await execFileAsync(bin.command, args, {
          maxBuffer: 10 * 1024 * 1024,
          timeout: 90_000,
          windowsHide: true,
        });
    return `${result.stdout ?? ""}`.trim();
  } catch (err: unknown) {
    const e = err as { message?: string; stdout?: string; stderr?: string };
    const combined = `${e.stderr ?? ""}\n${e.stdout ?? ""}\n${e.message ?? ""}`.trim();

    const isTransient =
      /\b429\b|rate.?limit|quota exceeded|ETIMEDOUT|ECONNRESET|ECONNREFUSED|socket hang up|TLS handshake timeout|i\/o timeout|Client\.Timeout|context deadline exceeded|connection reset|unexpected EOF|EOF|temporary failure|dial tcp|server closed idle connection|\b50[0234]\b|HTTP 5\d\d/i.test(
        combined
      );
    if (isTransient && attempt < 5) {
      const delayMs = attempt * 2500;
      console.warn(`   ⏳ Transient ${tool} CLI error (attempt ${attempt}/4), retrying in ${delayMs}ms...`);
      await new Promise((r) => setTimeout(r, delayMs));
      return runCli(tool, args, attempt + 1);
    }

    throw new Error(`${tool} ${args.slice(0, 3).join(" ")} failed: ${combined}`);
  }
}

function tryParseJson<T>(raw: string): T | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const idxArr = trimmed.indexOf("[");
    const idxObj = trimmed.indexOf("{");
    const start =
      idxArr >= 0 && idxObj >= 0 ? Math.min(idxArr, idxObj) : Math.max(idxArr, idxObj);
    if (start >= 0) {
      try {
        return JSON.parse(trimmed.slice(start)) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}

function extractDriveId(output: string): string | null {
  const parsed = tryParseJson<{ id?: string; documentId?: string; spreadsheetId?: string }>(output);
  if (parsed?.id) return parsed.id;
  if (parsed?.documentId) return parsed.documentId;
  if (parsed?.spreadsheetId) return parsed.spreadsheetId;

  const idMatch = output.match(/\(ID:\s*([A-Za-z0-9_-]{10,})\)/i);
  if (idMatch?.[1]) return idMatch[1];

  const urlMatch = output.match(/\/(?:d|folders|file\/d)\/([A-Za-z0-9_-]{10,})/);
  if (urlMatch?.[1]) return urlMatch[1];

  return null;
}

function formatIstDate(date: Date): string {
  // en-CA produces YYYY-MM-DD reliably
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatIstTime(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(date);
}

function formatIstDateTime(date: Date): string {
  return `${formatIstDate(date)} ${formatIstTime(date)} IST`;
}

interface DriveSearchItem {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  parents?: string[];
  trashed?: boolean;
}

async function searchDrive(params: {
  nameExact?: string;
  parentId?: string;
  type?: string;
  max?: number;
}): Promise<DriveSearchItem[]> {
  const args = ["readonly", "search", "--json", "--max", String(params.max ?? 25)];
  if (params.nameExact) args.push("--name-exact", params.nameExact);
  if (params.parentId) args.push("--parent-id", params.parentId);
  if (params.type) args.push("--type", params.type);

  const raw = await runCli("gdrive", args);
  const parsed = tryParseJson<DriveSearchItem[]>(raw);
  return Array.isArray(parsed) ? parsed.filter((item) => !item.trashed) : [];
}

async function ensureFolder(name: string, parentId?: string): Promise<{ id: string; url: string }> {
  const existing = await searchDrive({
    nameExact: name,
    parentId,
    type: "folder",
    max: 10,
  });

  if (existing.length > 0 && existing[0]) {
    const id = existing[0].id;
    return { id, url: existing[0].webViewLink || `https://drive.google.com/drive/folders/${id}` };
  }

  const args = ["mutate", "mkdir", name, "--json"];
  if (parentId) args.push("--parent", parentId);
  const output = await runCli("gdrive", args);
  let id = extractDriveId(output);

  if (!id) {
    const recheck = await searchDrive({ nameExact: name, parentId, type: "folder", max: 5 });
    id = recheck[0]?.id ?? null;
  }

  if (!id) {
    throw new Error(`Could not determine Drive folder ID after creating "${name}". Output: ${output}`);
  }

  return { id, url: `https://drive.google.com/drive/folders/${id}` };
}

function sanitizeCellValue(value: unknown, maxLen = 49000): string | number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const s = String(value ?? "")
    .replace(/\u0000/g, "")
    .replace(/\r?\n/g, " ")
    .trim();
  return s.length > maxLen ? `${s.slice(0, maxLen - 3)}...` : s;
}

interface SheetsInfoResponse {
  spreadsheetId: string;
  spreadsheetUrl: string;
  properties?: { title?: string; timeZone?: string; locale?: string };
  sheets?: Array<{
    properties?: {
      sheetId?: number;
      title?: string;
      index?: number;
      gridProperties?: { rowCount?: number; columnCount?: number; frozenRowCount?: number };
    };
  }>;
}

async function ensureMasterSpreadsheet(rootFolderId: string): Promise<{
  spreadsheetId: string;
  spreadsheetUrl: string;
}> {
  let candidates = await searchDrive({
    nameExact: MASTER_SPREADSHEET_NAME,
    parentId: rootFolderId,
    type: "spreadsheet",
    max: 5,
  });

  if (candidates.length === 0) {
    candidates = await searchDrive({
      nameExact: MASTER_SPREADSHEET_NAME,
      type: "spreadsheet",
      max: 5,
    });
  }

  let spreadsheetId = candidates[0]?.id ?? "";

  if (!spreadsheetId) {
    console.log(`📊 Creating Master Google Spreadsheet: "${MASTER_SPREADSHEET_NAME}"...`);
    const createdOut = await runCli("gsheets", [
      "mutate",
      "create",
      "--title",
      MASTER_SPREADSHEET_NAME,
      "--json",
    ]);
    spreadsheetId = extractDriveId(createdOut) ?? "";
    if (!spreadsheetId) {
      const lookup = await searchDrive({ nameExact: MASTER_SPREADSHEET_NAME, type: "spreadsheet", max: 5 });
      spreadsheetId = lookup[0]?.id ?? "";
    }
    if (!spreadsheetId) {
      throw new Error(`Failed to create master spreadsheet "${MASTER_SPREADSHEET_NAME}". Output: ${createdOut}`);
    }
    await runCli("gdrive", ["mutate", "mv", spreadsheetId, rootFolderId]);
  } else {
    // Ensure it sits inside rootFolderId
    const parents = candidates[0]?.parents;
    if (Array.isArray(parents) && !parents.includes(rootFolderId)) {
      await runCli("gdrive", ["mutate", "mv", spreadsheetId, rootFolderId]);
    }
  }

  const infoRaw = await runCli("gsheets", ["readonly", "info", spreadsheetId, "--json"]);
  const info = tryParseJson<SheetsInfoResponse>(infoRaw);
  const spreadsheetUrl =
    info?.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  const sheets = info?.sheets ?? [];
  const firstSheet = sheets[0]?.properties;
  const postsSheet = sheets.find((s) => s.properties?.title === POSTS_SHEET_TAB)?.properties ?? firstSheet;
  const postsSheetId = postsSheet?.sheetId ?? 0;

  if (postsSheet && postsSheet.title !== POSTS_SHEET_TAB) {
    await runCli("gsheets", [
      "mutate",
      "rename-sheet",
      spreadsheetId,
      "--sheet-id",
      String(postsSheetId),
      "--title",
      POSTS_SHEET_TAB,
    ]);
  }

  const currentCols = postsSheet?.gridProperties?.columnCount ?? 26;
  const neededCols = MASTER_SHEET_HEADERS.length + 2;
  if (currentCols < neededCols) {
    await runCli("gsheets", [
      "mutate",
      "insert-cols",
      spreadsheetId,
      "--sheet-id",
      String(postsSheetId),
      "--start",
      String(currentCols),
      "--count",
      String(neededCols - currentCols),
      "--inherit-from-before",
    ]);
  }

  if ((postsSheet?.gridProperties?.frozenRowCount ?? 0) < 1) {
    await runCli("gsheets", [
      "mutate",
      "freeze",
      spreadsheetId,
      "--sheet-id",
      String(postsSheetId),
      "--rows",
      "1",
    ]);
  }

  if (info?.properties?.timeZone !== "Asia/Calcutta" && info?.properties?.timeZone !== "Asia/Kolkata") {
    await runCli("gsheets", [
      "mutate",
      "change-settings",
      spreadsheetId,
      "--timezone",
      "Asia/Kolkata",
      "--locale",
      "en_US",
    ]);
  }

  // Ensure Row 1 headers exist & match
  const headerRaw = await runCli("gsheets", [
    "readonly",
    "read",
    spreadsheetId,
    `${POSTS_SHEET_TAB}!A1:AU1`,
    "--json",
  ]);
  const existingHeaders = tryParseJson<string[][]>(headerRaw) ?? [];
  const firstHeaderRow = existingHeaders[0] ?? [];
  const headersMatch =
    firstHeaderRow.length >= MASTER_SHEET_HEADERS.length &&
    firstHeaderRow[0] === MASTER_SHEET_HEADERS[0] &&
    firstHeaderRow[MASTER_SHEET_HEADERS.length - 1] ===
      MASTER_SHEET_HEADERS[MASTER_SHEET_HEADERS.length - 1];

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "ainews-sheet-init-"));
  try {
    if (!headersMatch) {
      const headerBatchPath = path.join(tmpDir, "headers.json");
      await fs.writeFile(
        headerBatchPath,
        JSON.stringify([{ op: "write", range: `${POSTS_SHEET_TAB}!A1`, data: [[...MASTER_SHEET_HEADERS]] }]),
        "utf8"
      );
      await runCli("gsheets", ["mutate", "batch", spreadsheetId, "-f", headerBatchPath]);

      await runCli("gsheets", [
        "mutate",
        "format",
        spreadsheetId,
        "--sheet-id",
        String(postsSheetId),
        "--start-row",
        "0",
        "--end-row",
        "1",
        "--start-col",
        "0",
        "--end-col",
        String(MASTER_SHEET_HEADERS.length),
        "--bold",
        "--align",
        "CENTER",
        "--bg-color",
        "#0F172A",
        "--fg-color",
        "#FFFFFF",
        "--wrap",
      ]);

      // Readable widths for key columns
      const colWidths: Array<[number, number, number]> = [
        [0, 1, 70],    // Post #
        [1, 3, 130],   // Date, Time
        [3, 5, 195],   // ISO, MongoID
        [5, 6, 95],    // Status
        [6, 7, 340],   // Title
        [7, 8, 250],   // Slug
        [8, 15, 240],  // All URLs
        [15, 21, 260], // Alts, Captions, Cat, Author, Tags, Excerpt
        [21, 25, 115], // WordCount, ReadingTime, Featured, Locale
        [25, 38, 250], // SEO columns
        [38, 47, 170], // ZeroGPT & source telemetry
      ];
      for (const [startCol, endCol, pixels] of colWidths) {
        await runCli("gsheets", [
          "mutate",
          "set-col-width",
          spreadsheetId,
          "--sheet-id",
          String(postsSheetId),
          "--start-col",
          String(startCol),
          "--end-col",
          String(endCol),
          "--pixels",
          String(pixels),
        ]);
      }
    }

    // Ensure Daily_Summary tab exists and has live KPI + QUERY breakdown
    let summarySheet = sheets.find((s) => s.properties?.title === SUMMARY_SHEET_TAB)?.properties;
    if (!summarySheet) {
      await runCli("gsheets", ["mutate", "add-sheet", spreadsheetId, "--title", SUMMARY_SHEET_TAB]);
      const refreshedRaw = await runCli("gsheets", ["readonly", "info", spreadsheetId, "--json"]);
      const refreshed = tryParseJson<SheetsInfoResponse>(refreshedRaw);
      summarySheet = refreshed?.sheets?.find((s) => s.properties?.title === SUMMARY_SHEET_TAB)?.properties;
    }

    if (summarySheet) {
      const summaryCheckRaw = await runCli("gsheets", [
        "readonly",
        "read",
        spreadsheetId,
        `${SUMMARY_SHEET_TAB}!A1:B10`,
        "--json",
      ]);
      const summaryCells = tryParseJson<string[][]>(summaryCheckRaw) ?? [];
      if (!summaryCells[0]?.[0]) {
        const summaryBatchPath = path.join(tmpDir, "summary.json");
        const queryFormula = `=IFERROR(QUERY({ARRAYFORMULA(TEXT(${POSTS_SHEET_TAB}!B2:B, "yyyy-mm-dd")), ${POSTS_SHEET_TAB}!E2:E, ${POSTS_SHEET_TAB}!V2:V, ${POSTS_SHEET_TAB}!W2:W, ${POSTS_SHEET_TAB}!AQ2:AQ, ${POSTS_SHEET_TAB}!AR2:AR}, "SELECT Col1, COUNT(Col2), AVG(Col3), AVG(Col4), SUM(Col5), SUM(Col6) WHERE Col2 IS NOT NULL GROUP BY Col1 ORDER BY Col1 DESC LABEL Col1 'Date (IST)', COUNT(Col2) 'Posts Published', AVG(Col3) 'Avg Word Count', AVG(Col4) 'Avg Read Min', SUM(Col5) 'Total Internal Links', SUM(Col6) 'Total External Links' FORMAT AVG(Col3) '0', AVG(Col4) '0.0'", 0), "No posts recorded yet")`;
        const summaryData = [
          ["AI News — Daily Publishing & SEO Tracker", "", "", "", "", ""],
          ["Metric", "Value", "Notes", "", "", ""],
          ["Total Posts Recorded", `=COUNTA(${POSTS_SHEET_TAB}!E2:E)`, "Unique MongoDB posts logged", "", "", ""],
          ["Posts Published Today (IST)", `=COUNTIF(${POSTS_SHEET_TAB}!B2:B, TEXT(TODAY(), "yyyy-mm-dd"))`, "Auto-counted for today's IST date", "", "", ""],
          ["Average Word Count", `=IFERROR(ROUND(AVERAGE(${POSTS_SHEET_TAB}!V2:V), 0), 0)`, "Target >= 800 words", "", "", ""],
          ["Average ZeroGPT AI Score (%)", `=IFERROR(ROUND(AVERAGE(${POSTS_SHEET_TAB}!AM2:AM), 2), "N/A")`, "Target <= 10%", "", "", ""],
          ["", "", "", "", "", ""],
          ["Daily Breakdown (Auto-Updated from Posts_Master)", "", "", "", "", ""],
          [queryFormula, "", "", "", "", ""],
        ];
        await fs.writeFile(
          summaryBatchPath,
          JSON.stringify([{ op: "write", range: `${SUMMARY_SHEET_TAB}!A1`, data: summaryData }]),
          "utf8"
        );
        await runCli("gsheets", ["mutate", "batch", spreadsheetId, "-f", summaryBatchPath]);

        const summaryId = summarySheet.sheetId ?? 1;
        await runCli("gsheets", [
          "mutate",
          "format",
          spreadsheetId,
          "--sheet-id",
          String(summaryId),
          "--start-row",
          "0",
          "--end-row",
          "1",
          "--start-col",
          "0",
          "--end-col",
          "6",
          "--bold",
          "--bg-color",
          "#0F172A",
          "--fg-color",
          "#FFFFFF",
        ]);
        await runCli("gsheets", [
          "mutate",
          "format",
          spreadsheetId,
          "--sheet-id",
          String(summaryId),
          "--start-row",
          "1",
          "--end-row",
          "2",
          "--start-col",
          "0",
          "--end-col",
          "3",
          "--bold",
          "--bg-color",
          "#E2E8F0",
        ]);
        await runCli("gsheets", [
          "mutate",
          "format",
          spreadsheetId,
          "--sheet-id",
          String(summaryId),
          "--start-row",
          "7",
          "--end-row",
          "9",
          "--start-col",
          "0",
          "--end-col",
          "6",
          "--bold",
          "--bg-color",
          "#1E293B",
          "--fg-color",
          "#FFFFFF",
        ]);
        await runCli("gsheets", [
          "mutate",
          "set-col-width",
          spreadsheetId,
          "--sheet-id",
          String(summaryId),
          "--start-col",
          "0",
          "--end-col",
          "6",
          "--pixels",
          "200",
        ]);
      }
    }
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }

  return { spreadsheetId, spreadsheetUrl };
}

async function readExistingSheetRows(spreadsheetId: string): Promise<{
  existingMongoIds: Set<string>;
  existingSlugs: Set<string>;
  rowCount: number;
}> {
  const raw = await runCli("gsheets", [
    "readonly",
    "read",
    spreadsheetId,
    `${POSTS_SHEET_TAB}!A2:I`,
    "--json",
  ]);
  const rows = tryParseJson<string[][]>(raw) ?? [];
  const existingMongoIds = new Set<string>();
  const existingSlugs = new Set<string>();

  for (const row of rows) {
    const mongoId = row[4]?.trim();
    const slug = row[7]?.trim();
    if (mongoId) existingMongoIds.add(mongoId);
    if (slug) existingSlugs.add(slug);
  }

  return { existingMongoIds, existingSlugs, rowCount: rows.length };
}

export async function initWorkspaceContext(): Promise<WorkspaceContext> {
  const rootFolder = await ensureFolder(AI_NEWS_ROOT_FOLDER_NAME);
  const { spreadsheetId, spreadsheetUrl } = await ensureMasterSpreadsheet(rootFolder.id);
  const { existingMongoIds, existingSlugs, rowCount } = await readExistingSheetRows(spreadsheetId);

  const dateFolderCache = new Map<string, string>();
  const existingDateFolders = await searchDrive({
    parentId: rootFolder.id,
    type: "folder",
    max: 100,
  });
  for (const df of existingDateFolders) {
    if (df.name && df.id) dateFolderCache.set(df.name, df.id);
  }

  return {
    rootFolderId: rootFolder.id,
    rootFolderUrl: rootFolder.url,
    spreadsheetId,
    spreadsheetUrl,
    dateFolderCache,
    existingMongoIds,
    existingSlugs,
    nextPostNumber: rowCount + 1,
  };
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&mdash;/gi, "—")
    .replace(/&ndash;/gi, "–")
    .replace(/&lsquo;/gi, "‘")
    .replace(/&rsquo;/gi, "’")
    .replace(/&ldquo;/gi, "“")
    .replace(/&rdquo;/gi, "”")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(parseInt(dec, 10)));
}

function resolveFullUrl(href: string, siteUrl: string): string {
  const clean = href.trim();
  if (!clean) return siteUrl;
  if (/^https?:\/\//i.test(clean)) return clean;
  if (clean.startsWith("/")) return `${siteUrl.replace(/\/$/, "")}${clean}`;
  return clean;
}

export function extractLinksFromHtml(
  html: string,
  siteUrl: string
): {
  internalLinks: Array<{ text: string; url: string }>;
  externalLinks: Array<{ text: string; url: string }>;
} {
  const internalLinks: Array<{ text: string; url: string }> = [];
  const externalLinks: Array<{ text: string; url: string }> = [];
  const cleanSite = siteUrl.replace(/\/$/, "");
  const anchorRegex = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  let m: RegExpExecArray | null;
  while ((m = anchorRegex.exec(html)) !== null) {
    const rawHref = (m[1] ?? "").trim();
    const anchorText = decodeHtmlEntities((m[2] ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
    if (!rawHref) continue;

    if (rawHref.startsWith("/") || rawHref.startsWith(cleanSite)) {
      internalLinks.push({
        text: anchorText || rawHref,
        url: resolveFullUrl(rawHref, cleanSite),
      });
    } else if (/^https?:\/\//i.test(rawHref)) {
      externalLinks.push({
        text: anchorText || rawHref,
        url: rawHref,
      });
    }
  }

  return { internalLinks, externalLinks };
}

export function htmlToMarkdownForGdoc(html: string, siteUrl: string): string {
  let md = html;

  // Code blocks first
  md = md.replace(/<pre[^>]*>\s*<code[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/gi, (_, code: string) => {
    const cleanCode = decodeHtmlEntities(code.replace(/<[^>]*>/g, "")).trim();
    return `\n\`\`\`\n${cleanCode}\n\`\`\`\n`;
  });

  // Images
  md = md.replace(/<img\b[^>]*src=["']([^"']+)["'][^>]*>/gi, (fullTag: string, src: string) => {
    const altMatch = fullTag.match(/alt=["']([^"']*)["']/i);
    const alt = decodeHtmlEntities(altMatch?.[1] || "Image").trim();
    const target = resolveFullUrl(src, siteUrl);
    if (!/^https?:\/\//i.test(target) || /\.(svg|webp)(\?|$)/i.test(target)) {
      return `\n[Image: ${alt}](${target})\n`;
    }
    return `\n![${alt}](${target})\n`;
  });

  // Inline formatting and links
  md = md.replace(
    /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
    (_, href: string, text: string) => {
      const label = decodeHtmlEntities(text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()) || href;
      const target = resolveFullUrl(href, siteUrl);
      return `[${label}](${target})`;
    }
  );

  md = md.replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_, __: string, inner: string) => {
    const text = inner.trim();
    return text ? `**${text}**` : "";
  });
  md = md.replace(/<(em|i)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_, __: string, inner: string) => {
    const text = inner.trim();
    return text ? `*${text}*` : "";
  });
  md = md.replace(/<code\b[^>]*>([\s\S]*?)<\/code>/gi, (_, inner: string) => `\`${inner.trim()}\``);

  // Headings (downgrade H1 -> H2 so document title stays the single H1)
  md = md.replace(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi, (_, t: string) => `\n## ${t.replace(/<[^>]*>/g, "").trim()}\n`);
  md = md.replace(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi, (_, t: string) => `\n## ${t.replace(/<[^>]*>/g, "").trim()}\n`);
  md = md.replace(/<h3\b[^>]*>([\s\S]*?)<\/h3>/gi, (_, t: string) => `\n### ${t.replace(/<[^>]*>/g, "").trim()}\n`);
  md = md.replace(/<h4\b[^>]*>([\s\S]*?)<\/h4>/gi, (_, t: string) => `\n#### ${t.replace(/<[^>]*>/g, "").trim()}\n`);

  // Ordered lists
  md = md.replace(/<ol\b[^>]*>([\s\S]*?)<\/ol>/gi, (_, listBody: string) => {
    const items: string[] = [];
    const liRegex = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
    let m: RegExpExecArray | null;
    while ((m = liRegex.exec(listBody)) !== null) {
      const text = (m[1] ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      if (text) items.push(`${items.length + 1}. ${text}`);
    }
    return items.length ? `\n${items.join("\n")}\n` : "\n";
  });

  // Unordered lists
  md = md.replace(/<ul\b[^>]*>([\s\S]*?)<\/ul>/gi, (_, listBody: string) => {
    const items: string[] = [];
    const liRegex = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
    let m: RegExpExecArray | null;
    while ((m = liRegex.exec(listBody)) !== null) {
      const text = (m[1] ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      if (text) items.push(`- ${text}`);
    }
    return items.length ? `\n${items.join("\n")}\n` : "\n";
  });

  // Blockquotes & breaks & paragraphs
  md = md.replace(/<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, inner: string) => {
    const text = inner.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    return `\n*${text}*\n`;
  });
  md = md.replace(/<hr\b[^>]*\/?>/gi, "\n---\n");
  md = md.replace(/<br\b[^>]*\/?>/gi, "\n");
  md = md.replace(/<p\b[^>]*>([\s\S]*?)<\/p>/gi, (_, inner: string) => `\n${inner.replace(/\s+/g, " ").trim()}\n`);

  // Strip remaining tags & decode entities
  md = md.replace(/<[^>]*>/g, "");
  md = decodeHtmlEntities(md);

  // Strip leading horizontal whitespace outside fenced code blocks so CommonMark never creates indented code blocks
  let inCodeFence = false;
  const normalizedLines = md.split(/\r?\n/).map((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("```")) {
      inCodeFence = !inCodeFence;
      return trimmed;
    }
    return inCodeFence ? line : line.replace(/^[ \t]+/, "");
  });

  return normalizedLines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function escapeMdTableCell(value: unknown): string {
  return String(value ?? "—")
    .replace(/\r?\n/g, " ")
    .replace(/\|/g, "/")
    .trim() || "—";
}

function countWordsInHtml(html: string): number {
  return html.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;
}

function detectImageExtension(coverUrl: string | undefined, contentType: string | null): string {
  if (contentType) {
    if (contentType.includes("png")) return ".png";
    if (contentType.includes("webp")) return ".webp";
    if (contentType.includes("jpeg") || contentType.includes("jpg")) return ".jpg";
  }
  if (coverUrl) {
    const m = coverUrl.split("?")[0]?.match(/\.(jpg|jpeg|png|webp)$/i);
    if (m?.[1]) {
      return m[1].toLowerCase() === "jpeg" ? ".jpg" : `.${m[1].toLowerCase()}`;
    }
  }
  return ".jpg";
}

async function resolveCoverImageBuffer(
  post: PostSyncInput
): Promise<{ buffer: Buffer | null; ext: string }> {
  if (post.imageBuffer && post.imageBuffer.length > 0) {
    return { buffer: post.imageBuffer, ext: ".jpg" };
  }

  const coverUrl = post.coverImage?.trim();
  if (!coverUrl || !/^https?:\/\//i.test(coverUrl)) {
    return { buffer: null, ext: ".jpg" };
  }

  try {
    const res = await fetch(coverUrl, {
      headers: { "User-Agent": "AINewsWorkspaceSync/1.0" },
      signal: AbortSignal.timeout(25_000),
    });
    if (!res.ok) return { buffer: null, ext: detectImageExtension(coverUrl, null) };
    const arr = await res.arrayBuffer();
    const buf = Buffer.from(arr);
    if (buf.length < 1000) return { buffer: null, ext: detectImageExtension(coverUrl, null) };
    const ext = detectImageExtension(coverUrl, res.headers.get("content-type"));
    return { buffer: buf, ext };
  } catch (err) {
    console.warn(`   ⚠️  Could not download cover image (${coverUrl}): ${(err as Error).message}`);
    return { buffer: null, ext: ".jpg" };
  }
}

async function uploadOrUpdateFileInFolder(
  localPath: string,
  driveFilename: string,
  folderId: string,
  mimeType?: string,
  preloadedChildren?: DriveSearchItem[]
): Promise<{ id: string; url: string }> {
  const existing = preloadedChildren
    ? preloadedChildren.filter((item) => item.name === driveFilename && item.mimeType !== "application/vnd.google-apps.folder")
    : await searchDrive({
        nameExact: driveFilename,
        parentId: folderId,
        max: 5,
      });

  if (existing.length > 0 && existing[0]) {
    const id = existing[0].id;
    const args = ["mutate", "update", id, localPath, "--json"];
    if (mimeType) args.push("--mime-type", mimeType);
    await runCli("gdrive", args);
    return { id, url: existing[0].webViewLink || `https://drive.google.com/file/d/${id}/view` };
  }

  const args = ["mutate", "upload", localPath, "--parent", folderId, "--json"];
  if (mimeType) args.push("--mime-type", mimeType);
  const out = await runCli("gdrive", args);
  let id = extractDriveId(out);

  if (!id) {
    const check = await searchDrive({ nameExact: driveFilename, parentId: folderId, max: 5 });
    id = check[0]?.id ?? null;
  }

  if (!id) {
    throw new Error(`Upload succeeded for ${driveFilename} but could not resolve Drive file ID. Output: ${out}`);
  }

  return { id, url: `https://drive.google.com/file/d/${id}/view` };
}

function buildStandaloneHtmlBackup(post: PostSyncInput, liveUrl: string): string {
  const seo = post.seo ?? {};
  return `<!DOCTYPE html>
<html lang="${post.locale || "en"}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtmlAttr(seo.metaTitle || post.title)}</title>
  <meta name="description" content="${escapeHtmlAttr(seo.metaDescription || post.excerpt)}" />
  <meta name="keywords" content="${escapeHtmlAttr([seo.focusKeyword, ...(seo.secondaryKeywords ?? [])].filter(Boolean).join(", "))}" />
  <link rel="canonical" href="${escapeHtmlAttr(seo.canonicalUrl || liveUrl)}" />
  <meta property="og:title" content="${escapeHtmlAttr(seo.ogTitle || post.title)}" />
  <meta property="og:description" content="${escapeHtmlAttr(seo.ogDescription || post.excerpt)}" />
  <meta property="og:image" content="${escapeHtmlAttr(seo.ogImage || post.coverImage || "")}" />
  <meta property="og:url" content="${escapeHtmlAttr(liveUrl)}" />
  <meta name="twitter:card" content="${escapeHtmlAttr(seo.twitterCard || "summary_large_image")}" />
</head>
<body>
  <main>
    <article data-post-id="${escapeHtmlAttr(post.id)}" data-slug="${escapeHtmlAttr(post.slug)}">
      <header>
        <h1>${escapeHtmlAttr(post.title)}</h1>
        <p><strong>Published:</strong> ${escapeHtmlAttr(formatIstDateTime(post.publishedAt))} | <strong>Author:</strong> ${escapeHtmlAttr(post.authorName || "Site Administrator")} | <strong>Category:</strong> ${escapeHtmlAttr(post.categoryName || "AI News")}</p>
        <p>${escapeHtmlAttr(post.excerpt)}</p>
        ${post.coverImage ? `<figure><img src="${escapeHtmlAttr(post.coverImage)}" alt="${escapeHtmlAttr(post.coverImageAlt || post.title)}" /><figcaption>${escapeHtmlAttr(post.coverImageCaption || "")}</figcaption></figure>` : ""}
      </header>
      <section>
        ${post.contentHtml}
      </section>
    </article>
  </main>
</body>
</html>
`;
}

function escapeHtmlAttr(val: string): string {
  return val
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildPostGoogleDocMarkdown(params: {
  post: PostSyncInput;
  liveUrl: string;
  postFolderUrl: string;
  driveCoverUrl: string;
  driveHtmlUrl: string;
  driveJsonUrl: string;
  wordCount: number;
  readingTime: number;
  internalLinks: Array<{ text: string; url: string }>;
  externalLinks: Array<{ text: string; url: string }>;
  localEmbeddableImagePath?: string;
}): string {
  const { post, liveUrl } = params;
  const siteUrl = post.siteUrl ? rewriteLegacyOriginUrl(post.siteUrl) : getSiteUrl();
  const seo = post.seo ?? {};
  const robots = seo.robots ?? {};
  const sitemap = seo.sitemap ?? {};
  const pubIst = formatIstDateTime(post.publishedAt);
  const robotsSummary = `index=${robots.index ?? true}, follow=${robots.follow ?? true}, noarchive=${robots.noarchive ?? false}, nosnippet=${robots.nosnippet ?? false}, maxImagePreview=${robots.maxImagePreview ?? "large"}`;
  const sitemapSummary = `include=${sitemap.include ?? true}, priority=${sitemap.priority ?? 0.9}, changefreq=${sitemap.changefreq ?? "daily"}`;
  const bodyMd = htmlToMarkdownForGdoc(post.contentHtml, siteUrl);

  const lines: string[] = [
    `# ${post.title}`,
    "",
    `*Published on **AI News** — ${pubIst}*`,
    "",
    "## 1. Publication & Technical Record",
    "",
    "| Field | Value |",
    "| --- | --- |",
    `| MongoDB ID | ${escapeMdTableCell(post.id)} |`,
    `| Status | ${escapeMdTableCell(post.status)} |`,
    `| Published Date (IST) | ${escapeMdTableCell(formatIstDate(post.publishedAt))} |`,
    `| Published Timestamp (IST) | ${escapeMdTableCell(pubIst)} |`,
    `| Published Timestamp (ISO) | ${escapeMdTableCell(post.publishedAt.toISOString())} |`,
    `| Slug | [${escapeMdTableCell(post.slug)}](${liveUrl}) |`,
    `| Live Site URL | [${liveUrl}](${liveUrl}) |`,
    `| Author | ${escapeMdTableCell(post.authorName || "Site Administrator")} |`,
    `| Category | ${escapeMdTableCell(post.categoryName || "AI News")} |`,
    `| Tags | ${escapeMdTableCell((post.tags ?? []).join(", "))} |`,
    `| Word Count | ${params.wordCount} words |`,
    `| Reading Time | ${params.readingTime} min |`,
    `| Featured | ${post.featured ? "Yes" : "No"} |`,
    `| Locale | ${escapeMdTableCell(post.locale || "en")} |`,
    `| Excerpt | ${escapeMdTableCell(post.excerpt)} |`,
    `| Upload Mode | ${escapeMdTableCell(post.uploadMode || "Auto Pipeline")} |`,
    `| ZeroGPT AI Score | ${typeof post.zeroGptScore === "number" ? `${post.zeroGptScore}%` : "N/A (Site / Manual Post)"} |`,
    `| ZeroGPT Feedback | ${escapeMdTableCell(post.zeroGptFeedback || "N/A")} |`,
    `| HTTP Verification | ${escapeMdTableCell(post.httpStatusVerified ?? "Published")} |`,
    `| News Source / Origin | ${escapeMdTableCell(post.newsSource || "AI News Editorial / Site")} |`,
    `| Source Wire URL | ${post.sourceWireUrl ? `[${post.sourceWireUrl}](${post.sourceWireUrl})` : "N/A"} |`,
    "",
    "## 2. Complete SEO Metadata Details",
    "",
    "| SEO Property | Value |",
    "| --- | --- |",
    `| SEO Meta Title | ${escapeMdTableCell(seo.metaTitle || post.title)} (${(seo.metaTitle || post.title).length} chars) |`,
    `| SEO Meta Description | ${escapeMdTableCell(seo.metaDescription || post.excerpt)} (${(seo.metaDescription || post.excerpt).length} chars) |`,
    `| Canonical URL | ${seo.canonicalUrl ? `[${seo.canonicalUrl}](${seo.canonicalUrl})` : `[${liveUrl}](${liveUrl})`} |`,
    `| Focus Keyword | ${escapeMdTableCell(seo.focusKeyword || "")} |`,
    `| Secondary Keywords | ${escapeMdTableCell((seo.secondaryKeywords ?? []).join(", "))} |`,
    `| OpenGraph (OG) Title | ${escapeMdTableCell(seo.ogTitle || post.title)} |`,
    `| OpenGraph (OG) Description | ${escapeMdTableCell(seo.ogDescription || post.excerpt)} |`,
    `| OpenGraph (OG) Image | ${seo.ogImage ? `[${seo.ogImage}](${seo.ogImage})` : post.coverImage ? `[${post.coverImage}](${post.coverImage})` : "N/A"} |`,
    `| Twitter Card | ${escapeMdTableCell(seo.twitterCard || "summary_large_image")} |`,
    `| Schema.org Type | ${escapeMdTableCell(seo.schemaType || "NewsArticle")} |`,
    `| Robots Directives | ${escapeMdTableCell(robotsSummary)} |`,
    `| Sitemap Settings | ${escapeMdTableCell(sitemapSummary)} |`,
    `| Breadcrumb Title | ${escapeMdTableCell(seo.breadcrumbTitle || post.title)} |`,
    `| Internal SEO Score | ${typeof seo.seoScore === "number" ? `${seo.seoScore}/100` : "Not scored"} |`,
    `| Redirect From | ${escapeMdTableCell((seo.redirectFrom ?? []).map((r) => (r.startsWith("/") ? `[${r}](${siteUrl}${r})` : r)).join(", ") || "None")} |`,
    `| Hreflang Alternates | ${escapeMdTableCell((seo.hreflang ?? []).map((h) => `${h.lang}: ${h.url}`).join("; ") || "None")} |`,
    `| IndexNow Status | ${escapeMdTableCell((typeof seo.indexNowStatus === "string" ? seo.indexNowStatus : seo.indexNowStatus?.status) || "Submitted / Auto")} |`,
    "",
    "## 3. Drive Folder & Media Asset Links",
    "",
    "| Asset | Location / Detail |",
    "| --- | --- |",
    `| Post Drive Subfolder | [Open Subfolder in Google Drive](${params.postFolderUrl}) |`,
    `| Drive Cover Image File | ${params.driveCoverUrl ? `[Open Cover Image](${params.driveCoverUrl})` : "N/A"} |`,
    `| Drive HTML Article Backup | ${params.driveHtmlUrl ? `[Open HTML File](${params.driveHtmlUrl})` : "N/A"} |`,
    `| Drive Full JSON Record | ${params.driveJsonUrl ? `[Open JSON Record](${params.driveJsonUrl})` : "N/A"} |`,
    `| Cloudinary CDN Cover URL | ${post.coverImage ? `[${post.coverImage}](${post.coverImage})` : "N/A"} |`,
    `| Cover Image Alt Text | ${escapeMdTableCell(post.coverImageAlt || post.title)} |`,
    `| Cover Image Caption | ${escapeMdTableCell(post.coverImageCaption || "")} |`,
    "",
  ];

  if (seo.schemaOverrides?.trim()) {
    lines.push("## 4. Custom Schema JSON-LD Overrides", "", "```json", seo.schemaOverrides.trim(), "```", "");
  }

  if (post.faqs && post.faqs.length > 0) {
    lines.push("## Article FAQs", "");
    post.faqs.forEach((f, i) => {
      lines.push(`### ${i + 1}. ${f.question}`, "", f.answer, "");
    });
  }

  lines.push(
    "## Link Graph Summary",
    "",
    `- **Internal Links (${params.internalLinks.length}):** ${
      params.internalLinks.length > 0
        ? params.internalLinks.map((l) => `[${l.text}](${l.url})`).join(" | ")
        : "None"
    }`,
    `- **External Links (${params.externalLinks.length}):** ${
      params.externalLinks.length > 0
        ? params.externalLinks.map((l) => `[${l.text}](${l.url})`).join(" | ")
        : "None"
    }`,
    ""
  );

  if (params.localEmbeddableImagePath) {
    lines.push("## Cover Artwork", "", `![${post.coverImageAlt || post.title}](${params.localEmbeddableImagePath})`, "");
  }

  lines.push("---", "", "## Full Article Content", "", bodyMd, "");

  return lines.join("\n");
}

export async function syncSinglePostToGoogleWorkspace(
  post: PostSyncInput,
  ctx?: WorkspaceContext
): Promise<SyncPostResult> {
  const workspace = ctx ?? (await initWorkspaceContext());
  const siteUrl = post.siteUrl ? rewriteLegacyOriginUrl(post.siteUrl) : getSiteUrl();
  const liveUrl = `${siteUrl}/blog/${post.slug}`;
  const pubDate = post.publishedAt instanceof Date ? post.publishedAt : new Date(post.publishedAt);
  const dateFolderName = formatIstDate(pubDate);

  // 1. Ensure Daily Date Subfolder inside "AI News"
  let dateFolderId = workspace.dateFolderCache.get(dateFolderName);
  if (!dateFolderId) {
    const df = await ensureFolder(dateFolderName, workspace.rootFolderId);
    dateFolderId = df.id;
    workspace.dateFolderCache.set(dateFolderName, dateFolderId);
  }

  // 2. Ensure Per-Post Subfolder inside Daily Date Folder
  const postFolderName = post.slug.slice(0, 100);
  const postFolder = await ensureFolder(postFolderName, dateFolderId);
  const folderChildren = await searchDrive({ parentId: postFolder.id, max: 50 });

  const wordCount = post.wordCount ?? countWordsInHtml(post.contentHtml);
  const readingTime = post.readingTime ?? Math.max(1, Math.ceil(wordCount / 200));
  const { internalLinks, externalLinks } = extractLinksFromHtml(post.contentHtml, siteUrl);

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "ainews-post-sync-"));
  try {
    // 3. Cover Image -> Upload to Post Subfolder
    let driveCoverUrl = "";
    let localEmbeddableImagePath: string | undefined;
    const { buffer: coverBuf, ext: coverExt } = await resolveCoverImageBuffer(post);
    if (coverBuf) {
      const coverFilename = `${post.slug.slice(0, 70)}-cover${coverExt}`;
      const localCoverPath = path.join(tmpDir, coverFilename);
      await fs.writeFile(localCoverPath, coverBuf);
      const uploadedCover = await uploadOrUpdateFileInFolder(
        localCoverPath,
        coverFilename,
        postFolder.id,
        undefined,
        folderChildren
      );
      driveCoverUrl = uploadedCover.url;
      // Google Docs import-md supports .jpg and .png seamlessly (not .webp/.svg); use short local filename
      if (coverExt === ".jpg" || coverExt === ".png") {
        const shortEmbedPath = path.join(tmpDir, `cover${coverExt}`);
        await fs.copyFile(localCoverPath, shortEmbedPath);
        localEmbeddableImagePath = shortEmbedPath;
      }
    }

    // 4. Standalone HTML Article File -> Upload to Post Subfolder
    const htmlFilename = `${post.slug.slice(0, 70)}.html`;
    const localHtmlPath = path.join(tmpDir, htmlFilename);
    await fs.writeFile(localHtmlPath, buildStandaloneHtmlBackup(post, liveUrl), "utf8");
    const uploadedHtml = await uploadOrUpdateFileInFolder(
      localHtmlPath,
      htmlFilename,
      postFolder.id,
      "text/html",
      folderChildren
    );

    // 5. Complete JSON Metadata + SEO Record -> Upload to Post Subfolder
    const jsonFilename = `${post.slug.slice(0, 70)}-record.json`;
    const localJsonPath = path.join(tmpDir, jsonFilename);
    const fullRecordPayload = {
      postId: post.id,
      title: post.title,
      slug: post.slug,
      status: post.status,
      publishedAtIso: pubDate.toISOString(),
      publishedDateIst: dateFolderName,
      publishedTimeIst: formatIstTime(pubDate),
      liveUrl,
      driveSubfolderUrl: postFolder.url,
      driveCoverUrl,
      driveHtmlUrl: uploadedHtml.url,
      cloudinaryCoverUrl: post.coverImage || "",
      coverImageAlt: post.coverImageAlt || "",
      coverImageCaption: post.coverImageCaption || "",
      author: post.authorName || "Site Administrator",
      category: post.categoryName || "AI News",
      tags: post.tags ?? [],
      excerpt: post.excerpt,
      wordCount,
      readingTime,
      featured: Boolean(post.featured),
      locale: post.locale || "en",
      seo: post.seo ?? {},
      faqs: post.faqs ?? [],
      zeroGpt: {
        aiScore: post.zeroGptScore ?? null,
        feedback: post.zeroGptFeedback ?? null,
      },
      source: {
        newsSource: post.newsSource ?? null,
        sourceWireUrl: post.sourceWireUrl ?? null,
      },
      links: {
        internalCount: internalLinks.length,
        externalCount: externalLinks.length,
        internalLinks,
        externalLinks,
      },
      httpStatusVerified: post.httpStatusVerified ?? "Published",
      uploadMode: post.uploadMode || "Auto Pipeline",
      syncedAtIst: formatIstDateTime(new Date()),
    };
    await fs.writeFile(localJsonPath, JSON.stringify(fullRecordPayload, null, 2), "utf8");
    const uploadedJson = await uploadOrUpdateFileInFolder(
      localJsonPath,
      jsonFilename,
      postFolder.id,
      "application/json",
      folderChildren
    );

    // 6. Google Doc (Content + Full SEO Details) inside Post Subfolder
    // Keep filename short ("post-doc.md") because gdocs checks paths/strings for raw 44-char ID-like slug substrings
    const localMdPath = path.join(tmpDir, "post-doc.md");
    const gdocMarkdown = buildPostGoogleDocMarkdown({
      post,
      liveUrl,
      postFolderUrl: postFolder.url,
      driveCoverUrl,
      driveHtmlUrl: uploadedHtml.url,
      driveJsonUrl: uploadedJson.url,
      wordCount,
      readingTime,
      internalLinks,
      externalLinks,
      localEmbeddableImagePath,
    });
    await fs.writeFile(localMdPath, gdocMarkdown, "utf8");

    const docTitle = `${post.title.slice(0, 120)} — Content & SEO`;
    const existingDocs = folderChildren.filter(
      (item) => item.mimeType === "application/vnd.google-apps.document"
    );

    let docId = existingDocs[0]?.id ?? "";
    if (docId) {
      await runCli("gdocs", [
        "mutate",
        "import-md",
        localMdPath,
        "--update",
        docId,
        "--auto-fit-tables",
        "--json",
      ]);
    } else {
      const importOut = await runCli("gdocs", [
        "mutate",
        "import-md",
        localMdPath,
        "--title",
        docTitle,
        "--folder",
        postFolder.id,
        "--auto-fit-tables",
        "--json",
      ]);
      docId = extractDriveId(importOut) ?? "";
      if (!docId) {
        const lookupDocs = await searchDrive({ parentId: postFolder.id, type: "document", max: 5 });
        docId = lookupDocs[0]?.id ?? "";
      }
      if (!docId) {
        throw new Error(`Failed to resolve Google Doc ID for "${post.title}". Output: ${importOut}`);
      }
    }

    const docUrl = `https://docs.google.com/document/d/${docId}/edit`;

    // 7. Append Record Row to Master Google Spreadsheet (unless already recorded)
    const alreadyInSheet =
      workspace.existingMongoIds.has(post.id) || workspace.existingSlugs.has(post.slug);

    if (!alreadyInSheet) {
      const seo = post.seo ?? {};
      const robots = seo.robots ?? {};
      const sitemap = seo.sitemap ?? {};
      const rowValues = [
        workspace.nextPostNumber,
        dateFolderName,
        formatIstTime(pubDate),
        pubDate.toISOString(),
        post.id,
        post.status,
        post.title,
        post.slug,
        liveUrl,
        docUrl,
        postFolder.url,
        driveCoverUrl,
        uploadedHtml.url,
        uploadedJson.url,
        post.coverImage || "",
        post.coverImageAlt || "",
        post.coverImageCaption || "",
        post.categoryName || "AI News",
        post.authorName || "Site Administrator",
        (post.tags ?? []).join(", "),
        post.excerpt,
        wordCount,
        readingTime,
        post.featured ? "Yes" : "No",
        post.locale || "en",
        seo.metaTitle || post.title,
        seo.metaDescription || post.excerpt,
        seo.canonicalUrl || liveUrl,
        seo.focusKeyword || "",
        (seo.secondaryKeywords ?? []).join(", "),
        seo.ogTitle || post.title,
        seo.ogDescription || post.excerpt,
        seo.ogImage || post.coverImage || "",
        seo.twitterCard || "summary_large_image",
        seo.schemaType || "NewsArticle",
        `index=${robots.index ?? true}, follow=${robots.follow ?? true}, maxImagePreview=${robots.maxImagePreview ?? "large"}`,
        `include=${sitemap.include ?? true}, priority=${sitemap.priority ?? 0.9}, changefreq=${sitemap.changefreq ?? "daily"}`,
        typeof seo.seoScore === "number" ? seo.seoScore : "",
        typeof post.zeroGptScore === "number" ? post.zeroGptScore : "",
        post.zeroGptFeedback || "",
        post.newsSource || "AI News Editorial / Site",
        post.sourceWireUrl || externalLinks.find((l) => !/arxiv\.org|huggingface\.co|indiaai\.gov\.in/i.test(l.url))?.url || "",
        internalLinks.length,
        externalLinks.length,
        String(post.httpStatusVerified ?? "200 OK"),
        post.uploadMode || "Auto Pipeline",
        formatIstDateTime(new Date()),
      ].map((v) => sanitizeCellValue(v));

      const batchPath = path.join(tmpDir, "append-row.json");
      await fs.writeFile(
        batchPath,
        JSON.stringify([{ op: "append", range: `${POSTS_SHEET_TAB}!A1`, data: [rowValues] }]),
        "utf8"
      );
      await runCli("gsheets", ["mutate", "batch", workspace.spreadsheetId, "-f", batchPath]);

      workspace.existingMongoIds.add(post.id);
      workspace.existingSlugs.add(post.slug);
      workspace.nextPostNumber += 1;
    }

    return {
      postId: post.id,
      slug: post.slug,
      dateFolderName,
      rootFolderId: workspace.rootFolderId,
      rootFolderUrl: workspace.rootFolderUrl,
      dateFolderId,
      postFolderId: postFolder.id,
      postFolderUrl: postFolder.url,
      docId,
      docUrl,
      driveCoverUrl,
      driveHtmlUrl: uploadedHtml.url,
      driveJsonUrl: uploadedJson.url,
      spreadsheetId: workspace.spreadsheetId,
      spreadsheetUrl: workspace.spreadsheetUrl,
      skippedSheetAppend: alreadyInSheet,
    };
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

interface RawPostDoc {
  _id: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  status: string;
  excerpt: string;
  contentHtml?: string;
  content?: { html?: string };
  coverImage?: string;
  coverImageAlt?: string;
  coverImageCaption?: string;
  focalPoint?: { x?: number; y?: number };
  author?: mongoose.Types.ObjectId;
  category?: mongoose.Types.ObjectId;
  tags?: mongoose.Types.ObjectId[];
  faqs?: Array<{ question: string; answer: string }>;
  readingTime?: number;
  featured?: boolean;
  allowComments?: boolean;
  locale?: string;
  publishedAt?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  seo?: PostSyncInput["seo"];
}

export async function reconcileUnsyncedPostsToGoogleWorkspace(options?: {
  limit?: number;
  sinceDays?: number;
  ctx?: WorkspaceContext;
}): Promise<{ synced: SyncPostResult[]; alreadySyncedCount: number; failed: Array<{ slug: string; error: string }> }> {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("MongoDB connection must be active before reconciling posts to Google Workspace.");
  }

  const workspace = options?.ctx ?? (await initWorkspaceContext());

  const query: Record<string, unknown> = { status: "published" };
  if (options?.sinceDays && options.sinceDays > 0) {
    query.publishedAt = { $gte: new Date(Date.now() - options.sinceDays * 24 * 60 * 60 * 1000) };
  }

  let cursor = db
    .collection<RawPostDoc>("posts")
    .find(query)
    .sort({ publishedAt: 1, createdAt: 1 });

  if (options?.limit && options.limit > 0) {
    cursor = cursor.limit(options.limit);
  }

  const posts = await cursor.toArray();

  // Preload authors, categories, and tags once
  const [users, categories, tags] = await Promise.all([
    db.collection<{ _id: mongoose.Types.ObjectId; name?: string }>("users").find({}).toArray(),
    db.collection<{ _id: mongoose.Types.ObjectId; name?: string }>("categories").find({}).toArray(),
    db.collection<{ _id: mongoose.Types.ObjectId; name?: string }>("tags").find({}).toArray(),
  ]);

  const userMap = new Map<string, string>(users.map((u) => [u._id.toString(), u.name || "Site Administrator"]));
  const categoryMap = new Map<string, string>(categories.map((c) => [c._id.toString(), c.name || "AI News"]));
  const tagMap = new Map<string, string>(tags.map((t) => [t._id.toString(), t.name || ""]));

  const synced: SyncPostResult[] = [];
  const failed: Array<{ slug: string; error: string }> = [];
  let alreadySyncedCount = 0;

  for (const raw of posts) {
    const idStr = raw._id.toString();
    if (workspace.existingMongoIds.has(idStr) || workspace.existingSlugs.has(raw.slug)) {
      alreadySyncedCount += 1;
      continue;
    }

    const html = raw.contentHtml || raw.content?.html || `<p>${raw.excerpt || ""}</p>`;
    const pubDate = raw.publishedAt
      ? new Date(raw.publishedAt)
      : raw.createdAt
      ? new Date(raw.createdAt)
      : new Date();

    const resolvedTags = (raw.tags ?? [])
      .map((tid) => tagMap.get(tid.toString()) ?? "")
      .filter(Boolean);

    try {
      console.log(`🔄 Syncing post [${idStr}] "${raw.title}" (${formatIstDate(pubDate)})...`);
      const res = await syncSinglePostToGoogleWorkspace(
        {
          id: idStr,
          title: raw.title,
          slug: raw.slug,
          status: raw.status,
          excerpt: raw.excerpt || "",
          contentHtml: html,
          coverImage: raw.coverImage,
          coverImageAlt: raw.coverImageAlt,
          coverImageCaption: raw.coverImageCaption,
          focalPoint: raw.focalPoint,
          authorName: raw.author ? userMap.get(raw.author.toString()) ?? "Site Administrator" : "Site Administrator",
          categoryName: raw.category ? categoryMap.get(raw.category.toString()) ?? "AI News" : "AI News",
          tags: resolvedTags,
          faqs: raw.faqs,
          readingTime: raw.readingTime,
          featured: raw.featured,
          allowComments: raw.allowComments,
          locale: raw.locale || "en",
          publishedAt: pubDate,
          createdAt: raw.createdAt ? new Date(raw.createdAt) : undefined,
          updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : undefined,
          seo: raw.seo,
          uploadMode: "Site / Manual Sync",
          httpStatusVerified: "Live DB Published",
        },
        workspace
      );
      console.log(`   ✅ Doc: ${res.docUrl}`);
      synced.push(res);
    } catch (err) {
      const msg = (err as Error).message;
      console.error(`   ❌ Failed syncing "${raw.slug}": ${msg}`);
      failed.push({ slug: raw.slug, error: msg });
    }
  }

  return { synced, alreadySyncedCount, failed };
}
