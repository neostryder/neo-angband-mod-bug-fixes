import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";

/**
 * core-adapter.ts is the only file that reads the game's internals.
 *
 * Every other source file gets engine values from the adapter, so moving the
 * mod to a new mod API means rewriting that one file. This scans the code of
 * every other non-test source file, with comments removed, for the ways a
 * file could reach past it.
 */
describe("the engine adapter boundary", () => {
  const ADAPTER = "core-adapter.ts";

  const FORBIDDEN: readonly (readonly [string, RegExp])[] = [
    [
      "a raw context member",
      /\bctx\s*(?:\?\.|\.)\s*(?:core|state|registries|snapshot|intent|events|characterStore|prefs|inspect|keymaps|ui|knownLevel|character|prompt)\b/u,
    ],
    ["a registries read", /\.\s*registries\b/u],
    ["a string-keyed context read", /\bctx\s*\[/u],
    ["an engine member destructured from the context", /\{[^}]*\b(?:core|state|registries)\b[^}]*\}\s*=\s*ctx\b/u],
    ["an engine name list", /typeof\s+import\s*\(\s*["']@rpgm-tools\/neo-angband-core["']\s*\)/u],
  ];

  /** Any file, the adapter included, may import the engine for types only. */
  const VALUE_IMPORT = /^\s*import\s+(?!type\b)[^;]*?from\s*["']@rpgm-tools\/neo-angband-core["']/mu;

  const stripComments = (code: string): string =>
    code.replace(/\/\*[\s\S]*?\*\//gu, "").replace(/(^|[^:"'\\])\/\/[^\n]*/gu, "$1");

  const sources = (): string[] =>
    readdirSync(new URL("./", import.meta.url)).filter(
      (f) => f.endsWith(".ts") && !f.endsWith(".test.ts") && !f.endsWith(".d.ts"),
    );

  const read = (f: string): string => stripComments(readFileSync(new URL(`./${f}`, import.meta.url), "utf8"));

  it("finds the adapter and the files it serves", () => {
    expect(sources()).toContain(ADAPTER);
    expect(sources()).toContain("plugin.ts");
  });

  it("is crossed by no other source file", () => {
    const hits: string[] = [];
    for (const f of sources()) {
      if (f === ADAPTER) continue;
      const code = read(f);
      for (const [what, re] of FORBIDDEN) if (re.test(code)) hits.push(`${f}: ${what}`);
    }
    expect(hits).toEqual([]);
  });

  it("leaves no runtime import of the engine anywhere", () => {
    const hits = sources().filter((f) => VALUE_IMPORT.test(read(f)));
    expect(hits).toEqual([]);
  });
});
