/**
 * `pnpm qr`: generates the pitch QR codes and proves each PNG scans.
 *
 *   pnpm qr                                  every entry of codes.json
 *   pnpm qr --url <url> --name <slug>        one ad hoc code
 *
 * Exits non-zero if any written PNG does not decode to exactly its URL.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { buildAssets, type QrAsset } from "./assets";
import { parseSpec, parseSpecList, QrSpecError, type QrSpec } from "./spec";
import { decodePng, pngDimensions } from "./verify";

/** Located from this file, never from the working directory, so the tool behaves the same wherever it is run from. */
const REPO_ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const CODES_FILE = fileURLToPath(new URL("../codes.json", import.meta.url));
const DEFAULT_OUT_DIR = join(REPO_ROOT, "docs", "pitch", "qr");

/**
 * Directory the user ran the command from. pnpm runs the script inside
 * tools/qr and records the original directory in INIT_CWD; relative --out
 * paths and the printed file paths are resolved against it.
 */
const INVOCATION_DIR = process.env.INIT_CWD ?? process.cwd();

const USAGE = `Usage:
  pnpm qr                                Generate every code listed in tools/qr/codes.json
  pnpm qr --url <url> --name <slug>      Generate one ad hoc code

Options:
  --url <url>        Address to encode (https, or http://localhost)
  --name <slug>      File-name stem: lowercase letters, digits, hyphens
  --title <text>     Heading on the card (default "Scan to open")
  --caption <text>   Address printed on the card (default: the URL without https://)
  --out <dir>        Output directory (default docs/pitch/qr)
  --help             Show this help`;

/** What one run has to do. */
interface Plan {
  readonly specs: readonly QrSpec[];
  readonly outDir: string;
}

/** One line of the report printed at the end. */
interface ReportRow {
  readonly file: string;
  readonly size: string;
  readonly decoded: string;
  /** "source" for an SVG, which is not decoded; otherwise the outcome of decoding the PNG. */
  readonly status: "source" | "verified" | "failed";
}

/** Reads and validates codes.json. */
function loadCodes(): QrSpec[] {
  const parsed: unknown = JSON.parse(readFileSync(CODES_FILE, "utf8"));
  return parseSpecList(parsed);
}

/** Turns command-line arguments into a plan, or null when help was requested. */
function planFromArgs(args: readonly string[]): Plan | null {
  const { values } = parseArgs({
    // pnpm forwards a literal "--" when the user writes `pnpm qr -- --url ...`.
    args: args.filter((arg) => arg !== "--"),
    options: {
      url: { type: "string" },
      name: { type: "string" },
      title: { type: "string" },
      caption: { type: "string" },
      out: { type: "string" },
      help: { type: "boolean", short: "h" },
    },
    strict: true,
    allowPositionals: false,
  });
  if (values.help === true) return null;

  const outDir = values.out === undefined ? DEFAULT_OUT_DIR : resolve(INVOCATION_DIR, values.out);
  const { url, name, title, caption } = values;
  if (url === undefined && name === undefined) {
    if (title !== undefined || caption !== undefined) {
      throw new QrSpecError("--title and --caption only apply to an ad hoc code: pass --url and --name too.");
    }
    return { specs: loadCodes(), outDir };
  }
  if (url === undefined || name === undefined) {
    throw new QrSpecError("An ad hoc code needs both --url and --name.");
  }
  return { specs: [parseSpec({ url, name, title, caption })], outDir };
}

/** Formats a byte count for the report. */
function formatBytes(bytes: number): string {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} kB`;
}

/** Path as the user would type it from where they ran the command. */
function displayPath(file: string): string {
  const fromInvocation = relative(INVOCATION_DIR, file);
  const shown = fromInvocation.startsWith("..") || isAbsolute(fromInvocation) ? file : fromInvocation;
  return shown.replaceAll("\\", "/");
}

/**
 * Writes one asset, then reads it back from disk. A PNG is decoded and must
 * give back exactly the URL it was generated for: what is checked is the
 * file that will end up on the slide, not the buffer in memory.
 */
function writeAndVerify(asset: QrAsset, spec: QrSpec, outDir: string): ReportRow {
  const file = join(outDir, asset.fileName);
  writeFileSync(file, asset.contents);
  const written = readFileSync(file);
  const bytes = formatBytes(written.byteLength);
  if (asset.format === "svg") {
    return { file: displayPath(file), size: bytes, decoded: "vector source", status: "source" };
  }
  const { width, height } = pngDimensions(written);
  const size = `${width} x ${height} px, ${bytes}`;
  const text = decodePng(written);
  if (text !== spec.url) {
    const decoded = `FAILED  expected ${spec.url}, got ${text ?? "nothing readable"}`;
    return { file: displayPath(file), size, decoded, status: "failed" };
  }
  return { file: displayPath(file), size, decoded: `OK  ${text}`, status: "verified" };
}

/** Prints the report as an aligned table. */
function printReport(rows: readonly ReportRow[]): void {
  const header = { file: "File", size: "Size", decoded: "Decoded" };
  const lines = [header, ...rows];
  const fileWidth = Math.max(...lines.map((line) => line.file.length));
  const sizeWidth = Math.max(...lines.map((line) => line.size.length));
  for (const line of lines) {
    console.log(`${line.file.padEnd(fileWidth)}  ${line.size.padEnd(sizeWidth)}  ${line.decoded}`);
  }
}

/** Runs the tool and returns the process exit code. */
function run(args: readonly string[]): number {
  const plan = planFromArgs(args);
  if (plan === null) {
    console.log(USAGE);
    return 0;
  }
  mkdirSync(plan.outDir, { recursive: true });
  const rows = plan.specs.flatMap((spec) =>
    buildAssets(spec).map((asset) => writeAndVerify(asset, spec, plan.outDir)),
  );
  printReport(rows);
  const failed = rows.filter((row) => row.status === "failed").length;
  if (failed > 0) {
    console.error(`\n${failed} PNG(s) did not decode to their URL. Do not use these images.`);
    return 1;
  }
  const verified = rows.filter((row) => row.status === "verified").length;
  console.log(`\nAll ${verified} PNG(s) decode to their exact URL.`);
  return 0;
}

/** Whether an error is a bad command line reported by node:util parseArgs. */
function isUsageError(error: unknown): error is Error {
  return (
    error instanceof Error && "code" in error && typeof error.code === "string" && error.code.startsWith("ERR_PARSE_ARGS")
  );
}

try {
  process.exitCode = run(process.argv.slice(2));
} catch (error) {
  if (!(error instanceof QrSpecError) && !isUsageError(error)) throw error;
  console.error(`Error: ${error.message}\n\n${USAGE}`);
  process.exitCode = 1;
}
