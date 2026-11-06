import { describe, expect, it } from "vitest";

import { displayUrl, parseSpec, parseSpecList, QrSpecError, validateName, validateUrl } from "./spec";

describe("validateUrl", () => {
  it("accepts https and returns the string untouched", () => {
    expect(validateUrl("https://souty.vercel.app")).toBe("https://souty.vercel.app");
    expect(validateUrl("https://example.org/a/b?c=1&d=2#e")).toBe("https://example.org/a/b?c=1&d=2#e");
  });

  it("accepts plain http only for a loopback host", () => {
    expect(validateUrl("http://localhost:3000")).toBe("http://localhost:3000");
    expect(validateUrl("http://127.0.0.1:3000/x")).toBe("http://127.0.0.1:3000/x");
    expect(() => validateUrl("http://souty.vercel.app")).toThrow(/plain http is only allowed for localhost/);
  });

  it.each([
    ["", /not a valid absolute URL/],
    ["souty.vercel.app", /not a valid absolute URL/],
    ["/just/a/path", /not a valid absolute URL/],
    ["ftp://example.org/file", /must start with https/],
    ["javascript:alert(1)", /must start with https/],
    ["mailto:team@example.org", /must start with https/],
    [" https://souty.vercel.app", /whitespace/],
    ["https://souty.vercel.app/a b", /whitespace/],
    ["https://user:secret@example.org", /username or password/],
  ])("rejects %j", (url, message) => {
    expect(() => validateUrl(url)).toThrow(QrSpecError);
    expect(() => validateUrl(url)).toThrow(message);
  });
});

describe("validateName", () => {
  it.each(["souty-app", "souty-site", "a", "v2", "pitch-2026-app"])("accepts %j", (name) => {
    expect(validateName(name)).toBe(name);
  });

  it.each([
    "",
    "Souty",
    "souty app",
    "souty_app",
    "souty.app",
    "../souty",
    "..",
    "a/b",
    "a\\b",
    "C:evil",
    "-souty",
    "souty-",
    "souty--app",
    "souty.png",
    "a".repeat(65),
  ])("rejects %j", (name) => {
    expect(() => validateName(name)).toThrow(QrSpecError);
  });

  it("reserves the card suffix", () => {
    expect(() => validateName("souty-card")).toThrow(/reserved for the card files/);
  });
});

describe("displayUrl", () => {
  it("drops the scheme and a trailing slash", () => {
    expect(displayUrl("https://souty.vercel.app")).toBe("souty.vercel.app");
    expect(displayUrl("https://souty.vercel.app/")).toBe("souty.vercel.app");
    expect(displayUrl("https://example.org/en/")).toBe("example.org/en");
    expect(displayUrl("http://localhost:3000/x?y=1")).toBe("localhost:3000/x?y=1");
  });
});

describe("parseSpec", () => {
  it("keeps a complete entry as written", () => {
    const entry = { name: "souty-app", url: "https://souty.vercel.app", caption: "souty.vercel.app", title: "Try Souty" };
    expect(parseSpec(entry)).toEqual(entry);
  });

  it("fills in the title and caption when they are missing", () => {
    expect(parseSpec({ name: "site", url: "https://example.org/" })).toEqual({
      name: "site",
      url: "https://example.org/",
      title: "Scan to open",
      caption: "example.org",
    });
  });

  it.each([
    [null, /must be an object/],
    ["https://souty.vercel.app", /must be an object/],
    [{ url: "https://souty.vercel.app" }, /"name" is required/],
    [{ name: "souty-app" }, /"url" is required/],
    [{ name: "souty-app", url: "https://souty.vercel.app", title: 3 }, /"title" must be a string/],
    [{ name: "souty-app", url: "https://souty.vercel.app", title: "   " }, /Title must be 1 to/],
    [{ name: "souty-app", url: "https://souty.vercel.app", title: "x".repeat(29) }, /Title must be 1 to/],
    [{ name: "souty-app", url: "https://souty.vercel.app", title: "صوتي" }, /Latin text only/],
    [{ name: "souty-app", url: "https://souty.vercel.app", caption: "souty\nvercel" }, /Latin text only/],
  ])("rejects %j", (entry, message) => {
    expect(() => parseSpec(entry)).toThrow(QrSpecError);
    expect(() => parseSpec(entry)).toThrow(message);
  });
});

describe("parseSpecList", () => {
  it("parses every entry in order", () => {
    const specs = parseSpecList([
      { name: "souty-app", url: "https://souty.vercel.app" },
      { name: "souty-site", url: "https://example.org" },
    ]);
    expect(specs.map((spec) => spec.name)).toEqual(["souty-app", "souty-site"]);
  });

  it("says which entry is wrong", () => {
    const list = [{ name: "souty-app", url: "https://souty.vercel.app" }, { name: "Bad Name", url: "https://example.org" }];
    expect(() => parseSpecList(list)).toThrow(/^Entry 2: Name "Bad Name" is not a safe slug/);
  });

  it("rejects duplicate names and non-arrays", () => {
    const entry = { name: "souty-app", url: "https://souty.vercel.app" };
    expect(() => parseSpecList([entry, entry])).toThrow(/Duplicate name "souty-app"/);
    expect(() => parseSpecList(entry)).toThrow(/must be a JSON array/);
  });
});
