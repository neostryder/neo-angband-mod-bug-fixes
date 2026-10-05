import { describe, expect, it, vi } from "vitest";
import * as neoCore from "@rpgm-tools/neo-angband-core";
import {
  api2Ok,
  api2Unavailable,
  type Api2HistoryAdd,
  type ModApi2,
} from "@rpgm-tools/neo-angband-mod-sdk";
import { createAdapter as createApi1Adapter } from "./core-adapter";
import { createAdapter, createHooks } from "./core-adapter-api2";
import plugin from "./plugin";
import { MESSAGE_CORRECTIONS, MISC_STRING_CORRECTIONS, MISSPELLINGS } from "./strings";

function fakeApi(flags: Readonly<Record<string, boolean>>, log: (message: string) => void): ModApi2 {
  const unavailable = async () => api2Unavailable("No game is running.");
  return {
    meta: {
      id: "bug-fixes",
      api: "2.0.0",
      engine: "0.0.0",
      tier: "first-party",
      flags,
      newCharacter: false,
      granted: () => false,
      log,
      settings: async () => api2Ok({}),
      setSetting: unavailable,
      mods: async () => api2Ok([]),
    },
    view: {
      world: unavailable,
      player: unavailable,
      monsters: unavailable,
      level: unavailable,
      input: unavailable,
      isCurrent: unavailable,
    },
    act: {
      submit: unavailable,
      answer: unavailable,
      controller: {
        owns: unavailable,
        setStatus: unavailable,
        markNondeterministic: unavailable,
        release: unavailable,
      },
    },
    events: { on: unavailable, off: unavailable },
    hooks: { available: [], active: [] },
    content: { own: unavailable, asset: unavailable, records: unavailable, lookup: unavailable },
    ui: {
      mount: unavailable,
      patch: unavailable,
      keys: { bind: unavailable, list: unavailable, remove: unavailable },
    },
    store: {
      prefs: { get: unavailable, set: unavailable },
      character: { get: unavailable, set: unavailable },
    },
  };
}

const ALL_ON = Object.freeze({
  "bugfix.textAndHistory": true,
  "bugfix.stateIntegrity": true,
  "bugfix.levelGeneration": true,
  "bugfix.armourValueFloor": true,
});

describe("the API 2 adapter", () => {
  it.each([{}, ALL_ON, { "bugfix.textAndHistory": false }])("keeps the API 1 flags for %j", (flags) => {
    const api1 = createApi1Adapter({ flags, core: neoCore });
    const api2 = createAdapter(fakeApi(flags, () => {}));
    expect(api2.meta.flags).toEqual(api1.meta.flags);
    expect(api2.meta.flags).toBe(flags);
  });

  it("sends the same diagnostic messages as API 1", () => {
    const api1Log = vi.fn();
    const api2Log = vi.fn();
    const api1 = createApi1Adapter({ flags: ALL_ON, core: neoCore, log: api1Log });
    const api2 = createAdapter(fakeApi(ALL_ON, api2Log));
    for (const message of ["", "bug-fixes: armour value floor installed (#179)"]) {
      expect(api2.meta.log(message)).toBe(api1.meta.log(message));
    }
    expect(api2Log.mock.calls).toEqual(api1Log.mock.calls);
  });

  it("keeps the log receiver", () => {
    const mod = fakeApi(ALL_ON, () => {});
    mod.meta.log = function () {
      expect(this).toBe(mod.meta);
    };
    createAdapter(mod).meta.log("diagnostic");
  });
});

describe("the API 2 hook counterparts", () => {
  const flagsFor = (mask: number) => Object.fromEntries(
    Object.keys(ALL_ON).map((flag, index) => [flag, (mask & (1 << index)) !== 0]),
  );
  const names = ["historyAdd", "historyDisplay", "messageText", "saveNoiseScent", "objectListTiebreak"];

  it.each(Array.from({ length: 16 }, (_, mask) => mask))("keeps the API 1 hook toggles for mask %i", (mask) => {
    const flags = flagsFor(mask);
    const api1 = plugin.hooks({ flags, core: neoCore });
    const api2 = createHooks({ id: "bug-fixes", flags });
    expect(Object.keys(api2).sort()).toEqual(Object.keys(api1).filter((name) => names.includes(name)).sort());
  });

  it("leaves every counterpart absent when flags are missing", () => {
    expect(createHooks({ id: "bug-fixes", flags: {} })).toEqual({});
  });

  const api1 = plugin.hooks({ flags: ALL_ON, core: neoCore });
  const api2 = createHooks({ id: "bug-fixes", flags: ALL_ON });

  it("rewrites the same messages as API 1", () => {
    for (const raw of [
      ...Object.keys(MESSAGE_CORRECTIONS),
      ...Object.keys(MISC_STRING_CORRECTIONS),
      ...MISSPELLINGS.map(([from]) => from),
      "That Wand had no useable energy",
      "Sgt. Pepper hits you.",
      "You have a Dagger {@w1. Keep!} (c).",
    ]) {
      expect(api2.messageText!(raw)).toBe(api1.messageText!(raw));
    }
  });

  const historyCases: Api2HistoryAdd[] = [
    { what: "Killed a unique", type: 0, duplicate: true },
    { what: "Killed a unique", type: 0, duplicate: false },
    { what: "expanded note", type: 0, duplicate: false, rawUserInput: "/say hello" },
    { what: "expanded note", type: 0, duplicate: false, rawUserInput: "/me waves" },
    { what: "expanded note", type: 0, duplicate: false, rawUserInput: "plain note" },
    { what: "expanded note", type: 0, duplicate: false, rawUserInput: "" },
    { what: "expanded note", type: 0, duplicate: true, rawUserInput: "/say hello" },
    { what: "/me waves", type: 0, duplicate: false, expandUserInput: true },
  ];

  it.each(historyCases)("returns the API 1 history result for %j without editing the entry", (facts) => {
    const entry = Object.freeze({ ...facts });
    const writable = { ...facts };
    const keep = api1.historyAdd!(writable);
    const decision = api2.historyAdd!(entry);
    const saved = {
      ...facts,
      ...(decision.what !== undefined ? { what: decision.what } : {}),
      ...(decision.expandUserInput === true ? { expandUserInput: true as const } : {}),
    };
    expect(decision.keep).toBe(keep);
    expect(saved).toEqual(writable);
    expect(entry).toEqual(facts);
    expect(api2.historyDisplay!(Object.freeze(saved), "A long player name")).toBe(
      api1.historyDisplay!(writable, "A long player name"),
    );
  });

  it("keeps the API 1 save decision", () => {
    expect(api2.saveNoiseScent!()).toBe(api1.saveNoiseScent!());
  });

  it("keeps the API 1 list order for ties and both directions", () => {
    const offsets = [-3, 0, 3].flatMap((dy) => [-3, 0, 3].map((dx) => Object.freeze({ dy, dx })));
    for (const a of offsets) {
      for (const b of offsets) {
        expect(api2.objectListTiebreak!(a, b)).toBe(api1.objectListTiebreak!(a, b));
      }
    }
  });
});
