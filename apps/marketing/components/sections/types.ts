import type { Dictionary } from "@/content";
import type { Locale } from "@/i18n/config";

/** Props every page section and site-chrome component receives. */
export interface SectionProps {
  dict: Dictionary;
  locale: Locale;
}
