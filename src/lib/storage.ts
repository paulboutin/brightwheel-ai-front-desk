import { seedState } from "./data";
import type { Answer, Policy, State } from "./types";
const KEY = "little-grove-front-desk-v1";
const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object";
const isDate = (value: unknown) =>
  typeof value === "string" && Number.isFinite(Date.parse(value));
function isPolicy(value: unknown): value is Policy {
  return (
    isObject(value) &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.category === "string" &&
    typeof value.answer === "string" &&
    Array.isArray(value.questions) &&
    value.questions.every((q) => typeof q === "string") &&
    Array.isArray(value.keywords) &&
    value.keywords.every((k) => typeof k === "string") &&
    typeof value.published === "boolean" &&
    Number.isInteger(value.version) &&
    isDate(value.updatedAt)
  );
}
function isAnswer(value: unknown): value is Answer {
  return (
    isObject(value) &&
    ["answered", "related", "unanswered", "sensitive", "urgent"].includes(
      String(value.status),
    ) &&
    typeof value.text === "string" &&
    typeof value.reason === "string" &&
    ["policy", "semantic", "safety"].includes(String(value.engine)) &&
    (value.policy === undefined || isPolicy(value.policy))
  );
}
export function loadState(): State {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(KEY) || "null");
    if (
      isObject(data) &&
      data.schema === 1 &&
      Array.isArray(data.policies) &&
      data.policies.every(isPolicy) &&
      Array.isArray(data.entries) &&
      data.entries.every(
        (e) =>
          isObject(e) &&
          typeof e.id === "string" &&
          typeof e.question === "string" &&
          isAnswer(e.answer) &&
          isDate(e.createdAt) &&
          ["open", "resolved"].includes(String(e.review)) &&
          typeof e.requested === "boolean" &&
          (e.feedback === undefined ||
            ["helpful", "unhelpful"].includes(String(e.feedback))),
      )
    )
      return { ...data, entries: data.entries.slice(0, 200) } as State;
  } catch {
    /* A fresh demo is safer than a broken storage payload. */
  }
  return seedState();
}
export function saveState(state: State): boolean {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({ ...state, entries: state.entries.slice(0, 200) }),
    );
    return true;
  } catch {
    return false;
  }
}
