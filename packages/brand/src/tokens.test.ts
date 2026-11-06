import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { palette } from "./palette";
import preset from "./tailwind-preset";

const css = readFileSync(new URL("./tokens.css", import.meta.url), "utf8");

/** Every custom property declared in tokens.css, by name (without the leading dashes). */
const declarations = new Map(
  Array.from(css.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g), (match) => [match[1] ?? "", (match[2] ?? "").trim()]),
);

/** "#2a1846" -> "42 24 70" */
function hexToChannels(hex: string): string {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff].join(" ");
}

/** Follows var() references until it reaches a literal value. */
function resolve(name: string, depth = 0): string {
  const value = declarations.get(name);
  if (value === undefined) throw new Error(`--${name} is not declared in tokens.css`);
  const reference = /^var\(--([a-z0-9-]+)\)$/.exec(value);
  if (reference === null || depth > 8) return value;
  return resolve(reference[1] ?? "", depth + 1);
}

/** Token names the Tailwind preset reads, e.g. "background" from rgb(var(--background-rgb) / ...). */
function presetTokens(node: unknown): string[] {
  if (typeof node === "string") {
    const match = /^rgb\(var\(--([a-z0-9-]+)-rgb\) \/ <alpha-value>\)$/.exec(node);
    if (match === null) throw new Error(`Unexpected colour in the preset: ${node}`);
    return [match[1] ?? ""];
  }
  if (typeof node === "object" && node !== null) return Object.values(node).flatMap(presetTokens);
  return [];
}

const hexTokens = [...declarations].filter(([, value]) => /^#[0-9a-f]{6}$/i.test(value));

describe("design tokens", () => {
  it("declare the palette as hex colours", () => {
    expect(hexTokens.length).toBeGreaterThanOrEqual(11);
  });

  it("give every hex colour matching RGB channels", () => {
    for (const [name, hex] of hexTokens) {
      expect(declarations.get(`${name}-rgb`), `--${name}-rgb`).toBe(hexToChannels(hex));
    }
  });

  it("give every colour role a channel twin that resolves to the same colour", () => {
    const roles = [...declarations.keys()].filter(
      (name) => !name.endsWith("-rgb") && !name.startsWith("font-") && declarations.has(`${name}-rgb`),
    );
    expect(roles).toContain("background");
    expect(roles).toContain("primary-foreground");
    for (const role of roles) {
      expect(resolve(`${role}-rgb`), `--${role}-rgb`).toBe(hexToChannels(resolve(role)));
    }
  });

  it("leave no colour role without channels", () => {
    const colourRoles = [...declarations.keys()].filter(
      (name) => !name.endsWith("-rgb") && !name.startsWith("font-") && /^#[0-9a-f]{6}$/i.test(resolve(name)),
    );
    for (const role of colourRoles) {
      expect(declarations.has(`${role}-rgb`), `--${role}-rgb`).toBe(true);
    }
  });
});

describe("Tailwind preset", () => {
  it("only uses tokens that tokens.css defines with channels", () => {
    const names = presetTokens(preset.theme.extend.colors);
    expect(names.length).toBeGreaterThan(20);
    for (const name of names) {
      expect(declarations.has(`${name}-rgb`), `--${name}-rgb`).toBe(true);
    }
  });
});

describe("palette.ts", () => {
  it("matches tokens.css colour for colour", () => {
    const kebab = (key: string) => key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
    for (const [key, hex] of Object.entries(palette)) {
      expect(declarations.get(kebab(key))?.toLowerCase(), key).toBe(hex.toLowerCase());
    }
  });
});
