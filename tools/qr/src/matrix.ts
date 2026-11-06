/**
 * The QR symbol itself: the module matrix for a string, and that matrix as
 * SVG path data. Everything here is pure and deterministic.
 */
import QRCode from "qrcode";

/**
 * Error correction level Q restores about a quarter of the symbol. That is
 * the right trade for a code projected on a screen and photographed at an
 * angle from the back of a room: sturdier than the default M, while keeping
 * the modules larger than level H would.
 */
const ERROR_CORRECTION_LEVEL = "Q";

/**
 * Blank margin, in modules, that scanners need around the symbol to find
 * it. Four is the minimum the QR specification asks for.
 */
export const QUIET_ZONE_MODULES = 4;

/** A QR symbol as a square grid of dark and light modules. */
export interface QrMatrix {
  /** Modules per side, excluding the quiet zone. */
  readonly size: number;
  /** QR version, 1 (21 modules) to 40 (177 modules). */
  readonly version: number;
  /** Whether the module at a row and column is dark. */
  isDark(row: number, column: number): boolean;
}

/** Encodes a string into its QR module matrix. */
export function createMatrix(text: string): QrMatrix {
  const { modules, version } = QRCode.create(text, { errorCorrectionLevel: ERROR_CORRECTION_LEVEL });
  const { size, data } = modules;
  return {
    size,
    version,
    isDark: (row, column) => data[row * size + column] === 1,
  };
}

/** Modules per side once the quiet zone is added on both edges. */
export function sizeWithQuietZone(matrix: QrMatrix): number {
  return matrix.size + 2 * QUIET_ZONE_MODULES;
}

/**
 * Path data for every dark module, in module units, already shifted by the
 * quiet zone. Each horizontal run of dark modules becomes one rectangle, so
 * the whole symbol is a single compact <path> with no seams between
 * neighbouring modules.
 */
export function matrixPath(matrix: QrMatrix): string {
  const segments: string[] = [];
  for (let row = 0; row < matrix.size; row += 1) {
    for (const run of darkRuns(matrix, row)) {
      const x = run.start + QUIET_ZONE_MODULES;
      const y = row + QUIET_ZONE_MODULES;
      segments.push(`M${x} ${y}h${run.length}v1h-${run.length}z`);
    }
  }
  return segments.join("");
}

/** A horizontal run of consecutive dark modules in one row. */
interface Run {
  readonly start: number;
  readonly length: number;
}

/** Finds the runs of consecutive dark modules in one row. */
function darkRuns(matrix: QrMatrix, row: number): Run[] {
  const runs: Run[] = [];
  let start = -1;
  for (let column = 0; column <= matrix.size; column += 1) {
    const dark = column < matrix.size && matrix.isDark(row, column);
    if (dark && start < 0) {
      start = column;
    } else if (!dark && start >= 0) {
      runs.push({ start, length: column - start });
      start = -1;
    }
  }
  return runs;
}
