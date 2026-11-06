import { notFound } from "next/navigation";

/**
 * Catches every unknown path under a locale so it renders the localized
 * not-found page instead of Next's bare default.
 */
export default function UnknownPath() {
  notFound();
}
