import { readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ASSET_CACHE, MODEL_FILES, MODEL_VERSION, WASM_DIR, WASM_FILES } from "./assets";
import { VOICE_DIR } from "./voice";

const publicDir = new URL("../public/", import.meta.url);
const onDisk = (url: string) => new URL(`.${url.split("?")[0]}`, publicDir);
const serviceWorker = readFileSync(new URL("sw.js", publicDir), "utf8");

describe("NFR-1 privacy: everything is self-hosted", () => {
  it("loads the models and the WASM runtime from this origin only", () => {
    for (const { url } of [...Object.values(MODEL_FILES), ...WASM_FILES]) {
      expect(url, url).toMatch(/^\/(models|wasm)\//);
    }
    expect(WASM_DIR).toBe("/wasm");
  });
});

describe("NFR-2 offline: model caching", () => {
  it("versions every model URL with MODEL_VERSION, so a new model is a new cache key", () => {
    for (const { url } of Object.values(MODEL_FILES)) {
      expect(url).toMatch(new RegExp(`\\?v=${MODEL_VERSION}$`));
    }
  });

  it("uses the same asset cache name as the service worker", () => {
    expect(serviceWorker).toContain(`const ASSET_CACHE = "${ASSET_CACHE}";`);
  });

  it("has the service worker serve /models/, /wasm/ and the voice clips from that cache", () => {
    const prefixes = /const ASSET_PREFIXES = \[(.*)\];/.exec(serviceWorker)?.[1] ?? "";
    expect(prefixes).toContain('"/models/"');
    expect(prefixes).toContain(`"${WASM_DIR}/"`);
    expect(prefixes).toContain(`"${VOICE_DIR}/"`);
  });
});

describe("NFR-3 model integrity: the declared files are the shipped files", () => {
  it.each([...Object.entries(MODEL_FILES), ...WASM_FILES.map((f) => [f.url, f] as const)])(
    "%s exists with the declared byte size",
    (_, { url, bytes }) => {
      // The sizes drive the load progress bar; a stale size means a model
      // was replaced without updating lib/assets.ts.
      expect(statSync(onDisk(url)).size).toBe(bytes);
    }
  );
});
