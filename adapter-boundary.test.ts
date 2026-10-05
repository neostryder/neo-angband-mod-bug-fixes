import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import ts from "typescript";

/** Syntax trees distinguish access to live game data from comments and quoted examples. */
describe("the engine adapter boundary", () => {
  const ADAPTER = "core-adapter.ts";
  const API2_ADAPTER = "core-adapter-api2.ts";
  const CORE = "@rpgm-tools/neo-angband-core";
  const CONTEXT_MEMBERS = new Set([
    "core", "state", "registries", "snapshot", "intent", "events", "characterStore",
    "prefs", "inspect", "keymaps", "ui", "knownLevel", "character", "prompt", "flags", "log",
  ]);

  const unwrap = (node: ts.Expression): ts.Expression => {
    while (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) ||
      ts.isTypeAssertionExpression(node) || ts.isNonNullExpression(node) || ts.isSatisfiesExpression(node)) {
      node = node.expression;
    }
    return node;
  };

  const isCore = (node: ts.Node | undefined): boolean =>
    node !== undefined && ts.isStringLiteralLike(node) && (node.text === CORE || node.text.startsWith(`${CORE}/`));

  function scan(file: string, code: string): string[] {
    const tree = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true);
    const hits = new Set<string>();
    const factories = new Set<string>();
    const adapterEngines = new Set<ts.Node>();

    for (const statement of tree.statements) {
      if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier) ||
        statement.moduleSpecifier.text !== "./core-adapter") continue;
      const bindings = statement.importClause?.namedBindings;
      if (!bindings || !ts.isNamedImports(bindings)) continue;
      for (const binding of bindings.elements) {
        if ((binding.propertyName ?? binding.name).text === "createAdapter") factories.add(binding.name.text);
      }
    }

    const fromAdapter = (node: ts.Expression): boolean => {
      const expression = unwrap(node);
      return ts.isCallExpression(expression) && ts.isIdentifier(expression.expression) &&
        factories.has(expression.expression.text);
    };

    const collect = (node: ts.Node): void => {
      if (ts.isVariableDeclaration(node) && node.initializer &&
        ts.isObjectBindingPattern(node.name) && fromAdapter(node.initializer)) {
        for (const binding of node.name.elements) {
          if (ts.isIdentifier(binding.name) && (binding.propertyName ?? binding.name).getText(tree) === "engine") {
            adapterEngines.add(binding);
          }
        }
      }
      ts.forEachChild(node, collect);
    };
    collect(tree);

    /** A same-named variable in another function cannot inherit the adapter's access. */
    const adapterEngine = (node: ts.Identifier): boolean => {
      for (let scope: ts.Node | undefined = node.parent; scope; scope = scope.parent) {
        if (!ts.isBlock(scope) && !ts.isSourceFile(scope) && !ts.isFunctionLike(scope)) continue;
        const bindings: ts.Node[] = [];
        const find = (child: ts.Node): void => {
          if (child !== scope && (ts.isBlock(child) || ts.isFunctionLike(child))) return;
          if (ts.isBindingElement(child) && ts.isIdentifier(child.name) && child.name.text === node.text) {
            bindings.push(child);
          }
          if ((ts.isVariableDeclaration(child) || ts.isParameter(child)) &&
            ts.isIdentifier(child.name) && child.name.text === node.text) bindings.push(child);
          ts.forEachChild(child, find);
        };
        find(scope);
        if (bindings.length > 0) return bindings.every((binding) => adapterEngines.has(binding));
      }
      return false;
    };

    const visit = (node: ts.Node): void => {
      if (ts.isImportDeclaration(node) && isCore(node.moduleSpecifier) && !node.importClause?.isTypeOnly) {
        hits.add("a runtime engine import");
      }
      if (ts.isExportDeclaration(node) && isCore(node.moduleSpecifier) && !node.isTypeOnly) {
        hits.add("a runtime engine re-export");
      }
      if (ts.isCallExpression(node) && isCore(node.arguments[0]) &&
        (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
          (ts.isIdentifier(node.expression) && node.expression.text === "require"))) {
        hits.add("a runtime engine load");
      }
      if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference) &&
        isCore(node.moduleReference.expression) && !node.isTypeOnly) hits.add("a runtime engine load");

      if (file !== ADAPTER) {
        if (ts.isIdentifier(node) && /engine$/iu.test(node.text)) {
          const parent = node.parent;
          const declarationName = (ts.isVariableDeclaration(parent) || ts.isParameter(parent) ||
            ts.isBindingElement(parent) || ts.isImportSpecifier(parent) || ts.isExportSpecifier(parent)) && parent.name === node;
          const propertyName = (ts.isPropertyAccessExpression(parent) || ts.isPropertyAssignment(parent) ||
            ts.isBindingElement(parent)) && ("propertyName" in parent ? parent.propertyName : parent.name) === node;
          if (!declarationName && !propertyName && !ts.isTypeNode(parent) && !adapterEngine(node)) {
            hits.add("an engine identifier outside the adapter");
          }
        }
        if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument) && isCore(node.argument.literal)) {
          hits.add("an engine name list");
        }
        if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
          const receiver = unwrap(node.expression);
          const name = ts.isPropertyAccessExpression(node) ? node.name.text :
            ts.isStringLiteralLike(node.argumentExpression) ? node.argumentExpression.text : undefined;
          if (ts.isIdentifier(receiver) && receiver.text === "ctx") hits.add("a raw context member");
          if (name === "registries") hits.add("a registries read");
          if (ts.isIdentifier(receiver) && /engine$/iu.test(receiver.text) && !adapterEngine(receiver)) {
            hits.add("an engine identifier outside the adapter");
          }
        }
        if (ts.isVariableDeclaration(node) && node.initializer && ts.isObjectBindingPattern(node.name)) {
          const receiver = unwrap(node.initializer);
          if (ts.isIdentifier(receiver) && receiver.text === "ctx" && node.name.elements.some((binding) =>
            CONTEXT_MEMBERS.has((binding.propertyName ?? binding.name).getText(tree).replace(/["']/gu, "")))) {
            hits.add("an engine member destructured from the context");
          }
          if (ts.isIdentifier(receiver) && /engine$/iu.test(receiver.text) && !adapterEngine(receiver)) {
            hits.add("an engine identifier outside the adapter");
          }
        }
      }
      if (file === API2_ADAPTER && ts.isIdentifier(node) && node.text === "ctx") hits.add("an API 1 context in the API 2 adapter");
      ts.forEachChild(node, visit);
    };
    visit(tree);
    return [...hits];
  }

  const sources = (folder = ""): string[] => readdirSync(new URL(`./${folder}`, import.meta.url), { withFileTypes: true })
    .flatMap((entry) => {
      if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "reference") return [];
      const path = `${folder}${entry.name}`;
      if (entry.isDirectory()) return sources(`${path}/`);
      return path.endsWith(".ts") && !path.endsWith(".test.ts") && !path.endsWith(".d.ts") ? [path] : [];
    });

  const read = (file: string): string => readFileSync(new URL(`./${file}`, import.meta.url), "utf8");

  it("finds the adapter and the files it serves", () => {
    expect(sources()).toContain(ADAPTER);
    expect(sources()).toContain(API2_ADAPTER);
    expect(sources()).toContain("plugin.ts");
  });

  it("is crossed by no other source file", () => {
    const hits: string[] = [];
    for (const f of sources()) {
      for (const what of scan(f, read(f))) hits.push(`${f}: ${what}`);
    }
    expect(hits).toEqual([]);
  });

  it("leaves no runtime import of the engine anywhere", () => {
    const hits = scan("plugin.js", read("plugin.js")).filter((hit) => hit.startsWith("a runtime engine"));
    expect(hits).toEqual([]);
  });

  it.each([
    ["ctx!.core", "a raw context member"],
    ["(ctx as any).state", "a raw context member"],
    ["ctx . core", "a raw context member"],
    ["ctx?.registries", "a raw context member"],
    ['ctx!["state"]', "a raw context member"],
    ['const { core: live } = (ctx as any);', "an engine member destructured from the context"],
    ['import { loc as gameEngine } from "@rpgm-tools/neo-angband-core";', "a runtime engine import"],
    ['import "@rpgm-tools/neo-angband-core";', "a runtime engine import"],
    ['export { loc } from "@rpgm-tools/neo-angband-core";', "a runtime engine re-export"],
    ['export * from "@rpgm-tools/neo-angband-core";', "a runtime engine re-export"],
    ['import("@rpgm-tools/neo-angband-core")', "a runtime engine load"],
    ['require("@rpgm-tools/neo-angband-core")', "a runtime engine load"],
    ['type Core = typeof import("@rpgm-tools/neo-angband-core");', "an engine name list"],
    ["(gameEngine as any).loc()", "an engine identifier outside the adapter"],
    ["gameengine . loc()", "an engine identifier outside the adapter"],
    ["const forwarded = gameengine;", "an engine identifier outside the adapter"],
    ["({ gameEngine })", "an engine identifier outside the adapter"],
    ["function f(engine: any) { return engine.loc(); }", "an engine identifier outside the adapter"],
  ])("rejects %s", (code, violation) => {
    expect(scan("plugin.ts", code)).toContain(violation);
  });

  it.each(["ctx", "ctx.flags", "createAdapter(ctx)", "const ctx = mod;"])("rejects %s in the API 2 twin", (code) => {
    expect(scan(API2_ADAPTER, code)).toContain("an API 1 context in the API 2 adapter");
  });

  it.each([
    'import type { Gen } from "@rpgm-tools/neo-angband-core";',
    'export type { Gen } from "@rpgm-tools/neo-angband-core";',
    '// ctx!.core\nconst example = "(ctx as any).state";',
    'const url = "https://example.com/ctx.core";',
    'import { createAdapter } from "./core-adapter"; const { engine: gameEngine } = createAdapter(ctx); gameEngine.level(gen);',
  ])("allows %s", (code) => {
    expect(scan("plugin.ts", code)).toEqual([]);
  });

  it("rejects an engine parameter that shadows an adapter binding", () => {
    const code = 'import { createAdapter } from "./core-adapter"; const { engine } = createAdapter(ctx); function f(engine: any) { return engine.loc(); }';
    expect(scan("plugin.ts", code)).toContain("an engine identifier outside the adapter");
  });
});
