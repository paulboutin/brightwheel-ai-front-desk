import { beforeEach, expect, it, vi } from "vitest";
import { loadState, saveState } from "./storage";
import { seedState } from "./data";
let stored: string | null;
beforeEach(() => {
  stored = null;
  vi.stubGlobal("localStorage", {
    getItem: () => stored,
    setItem: (_key: string, value: string) => {
      stored = value;
    },
  });
});
it("retains edited policy versions and feedback after reload", () => {
  const data = seedState();
  data.policies[0].answer = "We open at 8 am.";
  data.policies[0].version = 2;
  data.entries[0].feedback = "unhelpful";
  expect(saveState(data)).toBe(true);
  expect(loadState()).toEqual(data);
});
it("recovers from malformed JSON and invalid nested records", () => {
  stored = "{";
  expect(loadState()).toEqual(seedState());
  stored = JSON.stringify({
    schema: 1,
    policies: [{ id: "bad", questions: [], keywords: [] }],
    entries: [],
  });
  expect(loadState()).toEqual(seedState());
  stored = JSON.stringify({ ...seedState(), entries: [{ id: "bad" }] });
  expect(loadState()).toEqual(seedState());
});
it("reports storage failure rather than claiming persistence", () => {
  vi.stubGlobal("localStorage", {
    getItem: () => {
      throw new Error("blocked");
    },
    setItem: () => {
      throw new Error("quota");
    },
  });
  expect(saveState(seedState())).toBe(false);
  expect(loadState()).toEqual(seedState());
});
it("caps retained history at 200 questions", () => {
  const data = seedState();
  data.entries = Array.from({ length: 210 }, (_, i) => ({
    ...data.entries[0],
    id: String(i),
  }));
  saveState(data);
  expect(loadState().entries).toHaveLength(200);
});
