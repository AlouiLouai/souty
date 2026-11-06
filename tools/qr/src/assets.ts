/**
 * The four files produced for one QR code: plain and card, each as SVG and
 * PNG. Building them is pure; writing them is the CLI's job.
 */
import { renderCardSvg } from "./card";
import { rasterizeCard, rasterizePlain } from "./raster";
import { CARD_SUFFIX, type QrSpec } from "./spec";
import { renderQrSvg } from "./svg";

/** One generated file, ready to be written. */
export interface QrAsset {
  readonly fileName: string;
  readonly contents: Buffer;
  /** PNGs are decoded after writing to prove they scan; SVGs are their source. */
  readonly format: "svg" | "png";
}

/** Builds every asset for a spec, plain files first. */
export function buildAssets(spec: QrSpec): QrAsset[] {
  const plainSvg = renderQrSvg(spec.url);
  const cardSvg = renderCardSvg(spec);
  const cardName = `${spec.name}${CARD_SUFFIX}`;
  return [
    { fileName: `${spec.name}.svg`, contents: Buffer.from(plainSvg, "utf8"), format: "svg" },
    { fileName: `${spec.name}.png`, contents: rasterizePlain(plainSvg), format: "png" },
    { fileName: `${cardName}.svg`, contents: Buffer.from(cardSvg, "utf8"), format: "svg" },
    { fileName: `${cardName}.png`, contents: rasterizeCard(cardSvg), format: "png" },
  ];
}
