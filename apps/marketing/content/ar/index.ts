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
 * Arabic: Modern Standard Arabic for titles and bodies. The Tunisian Arabic
 * (Derja) lines are the brand voice and are the same in every language.
 */
export const ar: Dictionary = {
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
