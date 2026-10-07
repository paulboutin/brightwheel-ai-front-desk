import { beforeEach, expect, it, vi } from "vitest";
import { loadState, saveState } from "./storage";
import { seedState, legacyMealsPolicy, initialPolicies } from "./data";
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
it("persists email consent, simulated replies, and FAQ links without altering old entries", () => {
  const data = seedState();
  data.entries[0].emailFollowUp = {
    email: "parent@example.com",
    status: "simulated",
    consentedAt: data.entries[0].createdAt,
  };
  data.entries[0].staffReplies = [
    {
      id: "reply",
      text: "Here is the center's response.",
      createdAt: data.entries[0].createdAt,
      delivery: "simulated",
    },
  ];
  data.entries[0].faqPolicyId = "new-faq";
  saveState(data);
  expect(loadState()).toEqual(data);
});
it("adds the two new demo policies to an existing workspace without changing edits", () => {
  const old = seedState();
  old.policies = old.policies.filter(
    (p) => !["emergency-procedures", "medication-policy"].includes(p.id),
  );
  old.policies[0].answer = "Staff's custom opening hours.";
  saveState(old);
  const migrated = loadState();
  expect(migrated.policies).toHaveLength(old.policies.length + 2);
  expect(migrated.policies[0].answer).toBe(old.policies[0].answer);
  expect(migrated.entries).toEqual(old.entries);
  const medication = migrated.policies.find(
    (p) => p.id === "medication-policy",
  )!;
  medication.answer = "Staff's custom medication policy.";
  medication.published = false;
  saveState(migrated);
  expect(loadState().policies.find((p) => p.id === medication.id)).toEqual(
    medication,
  );
});

it("upgrades untouched meal guidance but preserves the previous answer citation", () => {
  const state = seedState();
  state.policies = state.policies.map((p) =>
    p.id === "meals" ? structuredClone(legacyMealsPolicy) : p,
  );
  state.entries[0].answer.policy = structuredClone(legacyMealsPolicy);
  saveState(state);
  const updated = loadState();
  expect(updated.policies.find((p) => p.id === "meals")).toEqual(
    initialPolicies.find((p) => p.id === "meals"),
  );
  expect(updated.entries).toEqual(state.entries);
});
it.each(["answer", "questions", "published"])(
  "preserves a staff change to meal %s during migration",
  (field) => {
    const state = seedState();
    const meal = structuredClone(legacyMealsPolicy);
    if (field === "answer") meal.answer = "Staff's custom dietary policy.";
    if (field === "questions") meal.questions.push("Custom question?");
    if (field === "published") meal.published = false;
    state.policies = state.policies.map((p) => (p.id === "meals" ? meal : p));
    saveState(state);
    expect(loadState().policies.find((p) => p.id === "meals")).toEqual(meal);
  },
);
