import type { Policy } from "./types";
import { normalize } from "./answer.ts";
export const MODEL_ID = "Xenova/all-MiniLM-L6-v2";
export const MODEL_REVISION = "751bff37182d3f1213fa05d7196b954e230abad9";
export type Match = { policyId: string; score: number };
// These specificity checks prevent common operational exceptions from being
// mistaken for general policies. They are deliberately not a complete intent model.
const specificTopics = [
  /\b(holiday|holidays|winter break|spring break|snow|weather|christmas|thanksgiving)\b/,
  /\b(weekly|every week|installments?|payment plan)\b/,
  /\b(ratio|ratios|staffing)\b/,
  /\b(potty|toilet|toileting|diaper|diapers)\b/,
  /\b(nap|naps|napping|sleep|sleeping)\b/,
  /\b(bus|buses|transport|transportation|shuttle)\b/,
  /\b(camera|cameras|video|webcam|livestream)\b/,
  /\b(discount|discounts|scholarship|scholarships|subsidy|subsidies)\b/,
];
export function eligiblePolicies(
  question: string,
  policies: Policy[],
): Policy[] {
  const topics = specificTopics.filter((pattern) =>
    pattern.test(normalize(question)),
  );
  return policies.filter(
    (policy) =>
      policy.published &&
      topics.every((pattern) =>
        pattern.test(
          normalize(
            [policy.title, policy.answer, ...policy.questions].join(" "),
          ),
        ),
      ),
  );
}
export function selectRelatedPolicy(
  matches: Match[],
  policies: Policy[],
): Policy | undefined {
  const ranked = matches.filter((match) =>
    policies.some((p) => p.id === match.policyId && p.published),
  );
  const best = ranked[0];
  if (
    !best ||
    best.score < 0.55 ||
    (ranked[1] && best.score - ranked[1].score < 0.08)
  )
    return;
  return policies.find((p) => p.id === best.policyId);
}
