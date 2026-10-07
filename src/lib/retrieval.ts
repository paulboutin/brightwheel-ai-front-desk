import type { Policy } from "./types";
import { normalize } from "./answer.ts";
export const MODEL_ID = "Xenova/all-MiniLM-L6-v2";
export const MODEL_REVISION = "751bff37182d3f1213fa05d7196b954e230abad9";
export type Match = { policyId: string; score: number };
// These specificity checks prevent common operational exceptions from being
// mistaken for general policies. They are deliberately not a complete intent model.
const specificTopics = [
  /\b(gluten|wheat|celiac|coeliac)\b/,
  /\b(nuts?|peanuts?|tree nuts?|nutfree)\b/,
  /\b(dairy|milk|lactose)\b/,
  /\b(vegan|vegetarian)\b/,
  /\b(kosher|halal)\b/,
  /\b(soy|sesame|eggs?)\b/,
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
  const mealtimeSupport = (text: string) =>
    /\b(help|assist\w*|support|supervis\w*)\b/.test(text) &&
    /\b(eat\w*|feed\w*|meals?|mealtime|lunch)\b/.test(text);
  return policies.filter((policy) => {
    const content = normalize(
      [policy.title, policy.answer, ...policy.questions].join(" "),
    );
    return (
      policy.published &&
      topics.every((pattern) => pattern.test(content)) &&
      (!mealtimeSupport(normalize(question)) ||
        [policy.title, policy.answer, ...policy.questions].some((part) =>
          part
            .split(/[.!?]/)
            .some((sentence) => mealtimeSupport(normalize(sentence))),
        ))
    );
  });
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
