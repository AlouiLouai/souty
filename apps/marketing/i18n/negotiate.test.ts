import { describe, expect, it } from "vitest";
import { localeFromPathname, negotiateLocale } from "./negotiate";

describe("negotiateLocale", () => {
  it("falls back to the default locale without a header", () => {
    expect(negotiateLocale(null)).toBe("en");
    expect(negotiateLocale(undefined)).toBe("en");
    expect(negotiateLocale("")).toBe("en");
  });

  it("matches an exact supported language", () => {
    expect(negotiateLocale("fr")).toBe("fr");
    expect(negotiateLocale("ar")).toBe("ar");
  });

  it("matches a regional tag to its base language", () => {
    expect(negotiateLocale("fr-TN,fr;q=0.9,en;q=0.8")).toBe("fr");
    expect(negotiateLocale("ar-TN")).toBe("ar");
    expect(negotiateLocale("AR-tn")).toBe("ar");
  });

  it("ranks by quality value, not header order", () => {
    expect(negotiateLocale("en;q=0.5, ar;q=0.9, fr;q=0.7")).toBe("ar");
  });

  it("keeps header order between equal qualities", () => {
    expect(negotiateLocale("fr, ar")).toBe("fr");
    expect(negotiateLocale("ar, fr")).toBe("ar");
  });

  it("skips unsupported languages and q=0 entries", () => {
    expect(negotiateLocale("de, es;q=0.9, fr;q=0.2")).toBe("fr");
    expect(negotiateLocale("fr;q=0, ar;q=0.1")).toBe("ar");
  });

  it("falls back to the default for wildcards, unsupported or malformed input", () => {
    expect(negotiateLocale("*")).toBe("en");
    expect(negotiateLocale("de, ja")).toBe("en");
    expect(negotiateLocale(";;;,,,q=")).toBe("en");
    expect(negotiateLocale("fr;q=abc")).toBe("en");
  });
});

describe("localeFromPathname", () => {
  it("reads a locale prefix", () => {
    expect(localeFromPathname("/fr")).toBe("fr");
    expect(localeFromPathname("/ar/anything")).toBe("ar");
  });

  it("ignores paths without a supported prefix", () => {
    expect(localeFromPathname("/")).toBeNull();
    expect(localeFromPathname("/de")).toBeNull();
    expect(localeFromPathname("/french")).toBeNull();
  });
});
