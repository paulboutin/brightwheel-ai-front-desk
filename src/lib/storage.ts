import { validEmail } from "./staff";
import { initialPolicies, seedState } from "./data";
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
function addNewDemoPolicies(policies: Policy[]): Policy[] {
  return [
    ...policies,
    ...initialPolicies
      .filter(
        (policy) =>
          ["emergency-procedures", "medication-policy"].includes(policy.id) &&
          !policies.some((existing) => existing.id === policy.id),
      )
      .map((policy) => structuredClone(policy)),
  ];
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
          (e.privacyRedirect === undefined ||
            typeof e.privacyRedirect === "boolean") &&
          (e.emailFollowUp === undefined ||
            (isObject(e.emailFollowUp) &&
              typeof e.emailFollowUp.email === "string" &&
              validEmail(e.emailFollowUp.email) &&
              isDate(e.emailFollowUp.consentedAt) &&
              ["pending", "simulated"].includes(
                String(e.emailFollowUp.status),
              ))) &&
          (e.faqPolicyId === undefined || typeof e.faqPolicyId === "string") &&
          (e.staffReplies === undefined ||
            (Array.isArray(e.staffReplies) &&
              e.staffReplies.every(
                (reply) =>
                  isObject(reply) &&
                  typeof reply.id === "string" &&
                  typeof reply.text === "string" &&
                  isDate(reply.createdAt) &&
                  reply.delivery === "simulated",
              ))) &&
          (e.feedback === undefined ||
            ["helpful", "unhelpful"].includes(String(e.feedback))),
      )
    )
      return {
        ...data,
        // Introduce new demo policies without overwriting staff edits or withdrawal.
        policies: addNewDemoPolicies(data.policies),
        entries: data.entries.slice(0, 200),
      } as State;
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
