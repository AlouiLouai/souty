import { create, type QRCode } from "qrcode";
import { palette } from "@souty/brand/palette";
import { Card } from "@/components/ui/Card";

/** Blank margin around the code, in modules. The QR standard asks for four. */
const QUIET_ZONE = 4;

/**
 * Builds one SVG path covering every dark module. Neighbours on the same
 * row are merged into a single rectangle to keep the markup small.
 */
function darkModulesPath({ modules }: QRCode): string {
  const { size } = modules;
  const rectangles: string[] = [];

  for (let row = 0; row < size; row++) {
    let runStart: number | null = null;
    // One step past the last column closes a run that touches the edge.
    for (let column = 0; column <= size; column++) {
      const dark = column < size && Boolean(modules.get(row, column));
      if (dark && runStart === null) {
        runStart = column;
      } else if (!dark && runStart !== null) {
        const length = column - runStart;
        rectangles.push(`M${runStart + QUIET_ZONE} ${row + QUIET_ZONE}h${length}v1h-${length}z`);
        runStart = null;
      }
    }
  }
  return rectangles.join("");
}

interface AppQrCodeProps {
  /** The address the code opens. */
  url: string;
  title: string;
  hint: string;
  /** Text alternative for the code itself. */
  alt: string;
}

/**
 * A card with the QR code that opens the Souty app, drawn on the server as
 * inline SVG: ink-plum modules on white, so it scans from a phone or a
 * projector and prints cleanly.
 */
export function AppQrCode({ url, title, hint, alt }: AppQrCodeProps) {
  // Level Q survives about a quarter of the code being smudged or cropped.
  const code = create(url, { errorCorrectionLevel: "Q" });
  const side = code.modules.size + QUIET_ZONE * 2;

  return (
    <Card
      tone="sky"
      depth="lg"
      className="mx-auto grid w-full max-w-[21rem] justify-items-center gap-4 p-6 text-center sm:p-7 lg:max-w-[24rem]"
    >
      <h3 className="text-[1.45rem] font-extrabold">{title}</h3>
      {/* Larger on wide screens, where the code is scanned from a projector. */}
      <div className="w-full min-w-[200px] max-w-[15rem] overflow-hidden rounded-2xl border-3 border-plum bg-white lg:max-w-[18rem]">
        <svg
          viewBox={`0 0 ${side} ${side}`}
          role="img"
          aria-label={alt}
          shapeRendering="crispEdges"
          className="block h-auto w-full"
        >
          <rect width={side} height={side} fill={palette.paper} />
          <path d={darkModulesPath(code)} fill={palette.plum} />
        </svg>
      </div>
      <p className="text-base text-plum-soft">{hint}</p>
    </Card>
  );
}
