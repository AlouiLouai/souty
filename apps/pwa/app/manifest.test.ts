import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import manifest from "./manifest";

describe("NFR-6 installable PWA manifest", () => {
  const m = manifest();

  it("installs as a standalone, portrait, Arabic right-to-left app", () => {
    expect(m.display).toBe("standalone");
    expect(m.orientation).toBe("portrait");
    expect(m.lang).toBe("ar");
    expect(m.dir).toBe("rtl");
    expect(m.start_url).toBe("/");
  });

  it("ships every icon it declares, including a maskable one", () => {
    const icons = m.icons ?? [];
    expect(icons.map((icon) => icon.sizes)).toEqual(expect.arrayContaining(["192x192", "512x512"]));
    expect(icons.some((icon) => icon.purpose === "maskable")).toBe(true);
    for (const icon of icons) {
      expect(existsSync(new URL(`../public${icon.src}`, import.meta.url)), icon.src).toBe(true);
    }
  });
});
