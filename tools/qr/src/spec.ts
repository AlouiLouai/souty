/**
 * What one QR code encodes and how its slide card is labelled, plus the
 * validation that turns untrusted input (codes.json, CLI flags) into it.
 */

/** A validated QR code request. */
export interface QrSpec {
  /** File-name stem of the generated assets, e.g. "souty-app". */
  readonly name: string;
  /** The exact string the code encodes and must decode back to. */
  readonly url: string;
  /** Heading printed above the code on the card. */
  readonly title: string;
  /** Human-readable address printed under the code on the card. */
  readonly caption: string;
}

/** Thrown for any input that cannot become a safe, scannable code. */
export class QrSpecError extends Error {
  override readonly name = "QrSpecError";
}

/** Suffix of the card files; a name ending in it would collide with them. */
export const CARD_SUFFIX = "-card";

const DEFAULT_TITLE = "Scan to open";
const NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const NAME_MAX_LENGTH = 64;
const TITLE_MAX_LENGTH = 28;
const CAPTION_MAX_LENGTH = 44;
/** Printable Basic Latin and Latin-1/Extended-A letters: what the card fonts cover. */
const LATIN_TEXT_PATTERN = /^[ -~¡-ſ]+$/;
const LOOPBACK_HOSTS: ReadonlySet<string> = new Set(["localhost", "127.0.0.1", "[::1]"]);

/**
 * Validates a file-name stem. Only lowercase letters, digits and single
 * hyphens are allowed, so a name can never contain a path separator, a dot
 * or anything else that would let it escape the output directory.
 */
export function validateName(name: string): string {
  if (name.length === 0 || name.length > NAME_MAX_LENGTH) {
    throw new QrSpecError(`Name must be 1 to ${NAME_MAX_LENGTH} characters, got ${name.length}.`);
  }
  if (!NAME_PATTERN.test(name)) {
    throw new QrSpecError(
      `Name "${name}" is not a safe slug: use lowercase letters, digits and single hyphens only (for example "souty-app").`,
    );
  }
  if (name.endsWith(CARD_SUFFIX)) {
    throw new QrSpecError(
      `Name "${name}" must not end with "${CARD_SUFFIX}": that suffix is reserved for the card files.`,
    );
  }
  return name;
}

/**
 * Validates the address to encode and returns it unchanged: the code must
 * decode to exactly what was asked for, so the string is never normalised.
 * Plain http is accepted only for a loopback host (local testing).
 */
export function validateUrl(url: string): string {
  if (url !== url.trim() || /\s/.test(url)) {
    throw new QrSpecError(`URL "${url}" must not contain whitespace.`);
  }
  const parsed = parseUrl(url);
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new QrSpecError(`URL "${url}" must start with https:// (got "${parsed.protocol}").`);
  }
  if (parsed.protocol === "http:" && !LOOPBACK_HOSTS.has(parsed.hostname)) {
    throw new QrSpecError(`URL "${url}" must use https: plain http is only allowed for localhost.`);
  }
  if (parsed.username !== "" || parsed.password !== "") {
    throw new QrSpecError(`URL "${url}" must not embed a username or password.`);
  }
  return url;
}

/** Parses a URL, converting the platform TypeError into a QrSpecError. */
function parseUrl(url: string): URL {
  try {
    return new URL(url);
  } catch {
    throw new QrSpecError(`URL "${url}" is not a valid absolute URL (expected something like https://example.org).`);
  }
}

/**
 * The address as a person would read it aloud: no scheme, no trailing
 * slash. Used as the caption when none is given.
 */
export function displayUrl(url: string): string {
  const { host, pathname, search } = new URL(url);
  const path = pathname === "/" ? "" : pathname.replace(/\/$/, "");
  return `${host}${path}${search}`;
}

/** Validates one line of card text (title or caption). */
function validateCardText(label: string, text: string, maxLength: number): string {
  const trimmed = text.trim();
  if (trimmed.length === 0 || trimmed.length > maxLength) {
    throw new QrSpecError(`${label} must be 1 to ${maxLength} characters, got ${trimmed.length}: "${trimmed}".`);
  }
  if (!LATIN_TEXT_PATTERN.test(trimmed)) {
    throw new QrSpecError(
      `${label} "${trimmed}" must be Latin text only: that is what the card's fonts cover.`,
    );
  }
  return trimmed;
}

/** Reads a required string property from an untrusted record. */
function requiredString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== "string") {
    throw new QrSpecError(`"${key}" is required and must be a string.`);
  }
  return value;
}

/** Reads an optional string property from an untrusted record. */
function optionalString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  if (value === undefined) return undefined;
  if (typeof value !== "string") {
    throw new QrSpecError(`"${key}" must be a string when present.`);
  }
  return value;
}

/** Narrows an untrusted value to a plain object. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Turns untrusted input into a validated spec. `name` and `url` are
 * required; `title` and `caption` fall back to sensible defaults.
 */
export function parseSpec(input: unknown): QrSpec {
  if (!isRecord(input)) {
    throw new QrSpecError("A QR code entry must be an object with at least a name and a url.");
  }
  const name = validateName(requiredString(input, "name"));
  const url = validateUrl(requiredString(input, "url"));
  const title = validateCardText("Title", optionalString(input, "title") ?? DEFAULT_TITLE, TITLE_MAX_LENGTH);
  const caption = validateCardText("Caption", optionalString(input, "caption") ?? displayUrl(url), CAPTION_MAX_LENGTH);
  return { name, url, title, caption };
}

/**
 * Validates a whole list (the contents of codes.json), prefixing each
 * error with the entry it came from and rejecting duplicate names, which
 * would silently overwrite each other's files.
 */
export function parseSpecList(input: unknown): QrSpec[] {
  if (!Array.isArray(input)) {
    throw new QrSpecError("The list of QR codes must be a JSON array.");
  }
  const specs = input.map((entry, index) => parseEntry(entry, index));
  const seen = new Set<string>();
  for (const spec of specs) {
    if (seen.has(spec.name)) {
      throw new QrSpecError(`Duplicate name "${spec.name}": every QR code needs its own name.`);
    }
    seen.add(spec.name);
  }
  return specs;
}

/** Parses one list entry, adding its position to any validation error. */
function parseEntry(entry: unknown, index: number): QrSpec {
  try {
    return parseSpec(entry);
  } catch (error) {
    if (error instanceof QrSpecError) {
      throw new QrSpecError(`Entry ${index + 1}: ${error.message}`);
    }
    throw error;
  }
}
