/**
 * NFR-8: the app shows no text except the signed words. Many Deaf
 * Tunisians do not read, so every instruction is a picture and every
 * control an icon. This test reads every component and fails on text a
 * user could see:
 *
 * - JSX text, and string literals anywhere inside a child expression
 *   (`{a && "x"}`, `{a ? "x" : "y"}`, `{["x"].map(...)}`, templates);
 * - string attributes, unless the attribute is known to be invisible
 *   (`className`, `aria-*`, `ariaLabel`, SVG geometry...). Anything else,
 *   `title`, `alt`, `placeholder`, or a custom component's `label`, counts.
 *
 * Digits and "%" count as text in children: a percentage is text too.
 * Screen-reader text goes through `aria-label`/`ariaLabel`, or a named
 * constant rendered into an `sr-only` live region.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SOURCE_DIRS = ["app", "components"];
const CHILD_TEXT = /[\p{L}\p{N}%]/u;
const ATTRIBUTE_TEXT = /\p{L}/u;

/** Attributes no user ever sees. Every other string attribute must be free of text. */
const INVISIBLE_ATTRIBUTES = new Set([
  "className", "style", "key", "id", "href", "src", "type", "role", "dir", "lang", "ariaLabel", "htmlFor", "rel", "target",
  "inputMode", "autoComplete", "focusable", "xmlns", "d", "viewBox", "fill", "stroke", "strokeWidth",
  "strokeLinecap", "strokeLinejoin", "transform", "opacity", "attributeName", "values", "keyTimes",
  "keySplines", "calcMode", "begin", "dur", "repeatCount",
]);
/** Styling props of our own components (Button variant/size, iconClassName...) are invisible too. */
const isInvisible = (name: string) =>
  INVISIBLE_ATTRIBUTES.has(name) ||
  name === "variant" ||
  name === "size" ||
  name.endsWith("ClassName") ||
  name.startsWith("aria-") ||
  name.startsWith("data-");

function tsxFiles(dir: string): string[] {
  return readdirSync(join(ROOT, dir), { recursive: true, encoding: "utf8" })
    .filter((file) => file.endsWith(".tsx"))
    .map((file) => join(ROOT, dir, file));
}

function literalText(node: ts.Node): string | null {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isTemplateExpression(node)) {
    return [node.head.text, ...node.templateSpans.map((span) => span.literal.text)].join("");
  }
  return null;
}

const COMPARISONS = new Set([
  ts.SyntaxKind.EqualsEqualsEqualsToken,
  ts.SyntaxKind.ExclamationEqualsEqualsToken,
  ts.SyntaxKind.EqualsEqualsToken,
  ts.SyntaxKind.ExclamationEqualsToken,
]);

/**
 * String literals an expression can render. Skips what cannot reach the
 * screen: comparison operands (`x === "a"`), call arguments (`cn("...")`),
 * and nested JSX (visited on its own).
 */
function renderedLiterals(node: ts.Node, out: ts.Node[] = []): ts.Node[] {
  if (literalText(node) !== null) {
    out.push(node);
    return out;
  }
  if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node)) return out;
  if (ts.isBinaryExpression(node) && COMPARISONS.has(node.operatorToken.kind)) return out;
  if (ts.isCallExpression(node)) return renderedLiterals(node.expression, out);
  // MAP["key"]: the key picks a value, it is not shown.
  if (ts.isElementAccessExpression(node)) return renderedLiterals(node.expression, out);
  if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) return renderedLiterals(node.body, out);
  ts.forEachChild(node, (child) => void renderedLiterals(child, out));
  return out;
}

/** Every piece of visible text in some TSX source, as "file:line text". */
function visibleTextIn(file: string, code: string): string[] {
  const source = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const found: string[] = [];
  const report = (node: ts.Node, text: string) => {
    const { line } = source.getLineAndCharacterOfPosition(node.getStart(source));
    found.push(`${relative(ROOT, file)}:${line + 1} ${JSON.stringify(text.trim())}`);
  };
  const reportLiterals = (expression: ts.Node, pattern: RegExp) => {
    for (const literal of renderedLiterals(expression)) {
      const text = literalText(literal) ?? "";
      if (pattern.test(text)) report(literal, text);
    }
  };

  const visit = (node: ts.Node) => {
    if (ts.isJsxText(node) && CHILD_TEXT.test(node.text)) report(node, node.text);

    if (ts.isJsxExpression(node) && node.expression && (ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent))) {
      reportLiterals(node.expression, CHILD_TEXT);
    }

    if (ts.isJsxAttribute(node) && node.initializer && !isInvisible(node.name.getText(source))) {
      const value = ts.isJsxExpression(node.initializer) ? node.initializer.expression : node.initializer;
      if (value) reportLiterals(value, ATTRIBUTE_TEXT);
    }

    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

const visibleText = (file: string) => visibleTextIn(file, readFileSync(file, "utf8"));
const probe = (code: string) => visibleTextIn(join(ROOT, "components", "Probe.tsx"), code);

describe("NFR-8 pictures, not text", () => {
  const files = SOURCE_DIRS.flatMap(tsxFiles);

  it("finds the components to check", () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it("shows no text in any component (only the signed words, which are data)", () => {
    expect(files.flatMap(visibleText)).toEqual([]);
  });

  it("catches text however it is written", () => {
    expect(probe(`const A = () => <p>مرحبا</p>;`)).toHaveLength(1);
    expect(probe(`const A = () => <p>{"hi"}</p>;`)).toHaveLength(1);
    expect(probe("const A = () => <p>{`t${1}`}</p>;")).toHaveLength(1);
    expect(probe(`const A = ({ a }) => <p>{a && "x"}</p>;`)).toHaveLength(1);
    expect(probe(`const A = ({ a }) => <p>{a ? "x" : "y"}</p>;`)).toHaveLength(2);
    expect(probe(`const A = () => <p>{["x", "y"].map((t) => t)}</p>;`)).toHaveLength(2);
    expect(probe(`const A = () => <p>42%</p>;`)).toHaveLength(1);
    expect(probe(`const A = () => <img alt="logo" />;`)).toHaveLength(1);
    expect(probe(`const A = () => <p title={"tip"} />;`)).toHaveLength(1);
    expect(probe(`const A = () => <Dialog label="Loading" />;`)).toHaveLength(1);
    expect(probe(`const A = () => <Dialog children="x" />;`)).toHaveLength(1);
    expect(probe(`const A = () => <Button variant="outline" size="icon" iconClassName="h-4" label="Go" />;`)).toHaveLength(1);
  });

  it("allows what nobody sees, and data", () => {
    expect(
      probe(
        `const A = ({ word, a }) => <p aria-label="ok" ariaLabel="ok" className={cn("x", a && "y")} dir="rtl" data-x="y">
          {word} {a === "x" && <b />} {label(word, "x")} {LABELS[a ? "on" : "off"]}
          <svg viewBox="0 0 2 2"><path d="M0 0" fill="none" /></svg>
        </p>;`
      )
    ).toEqual([]);
  });
});
