import type { Dictionary } from "..";
import { cta } from "./cta";
import { footer } from "./footer";
import { hero } from "./hero";
import { idea } from "./idea";
import { meta } from "./meta";
import { nav } from "./nav";
import { problem } from "./problem";
import { product } from "./product";
import { proof } from "./proof";
import { roadmap } from "./roadmap";
import { vision } from "./vision";

/**
 * French dictionary. Same slices and same shape as the English source.
 *
 * Each slice is typed as `Dictionary["<slice>"]`, so a missing key and an
 * extra key are both compile errors in the slice file itself.
 *
 * Typography: the space before `:`, `;`, `!` and `?`, the spaces inside
 * « » and the one between a number and its unit are non-breaking spaces
 * (U+00A0), so punctuation never starts a line. They look like plain spaces
 * in an editor: keep them when editing. The Tunisian Arabic lines are the
 * brand voice and are the same in every language.
 */
export const fr: Dictionary = {
  meta,
  nav,
  hero,
  problem,
  idea,
  product,
  proof,
  roadmap,
  vision,
  cta,
  footer,
};
