import type { Answer, Policy } from "./types";
export const normalize = (text: string) =>
  text.toLowerCase().normalize("NFKC").replace(/[’]/g, "'").trim();
export function safetyAnswer(question: string): Answer | undefined {
  const q = normalize(question);
  if (
    /can't breathe|cannot breathe|not breathing|choking|unconscious|unresponsive|seizure|immediate danger|emergency|trouble breathing/.test(
      q,
    )
  )
    return {
      status: "urgent",
      text: "If someone is in immediate danger, call your local emergency number now (911 in the US). Do not wait for a reply here. This demo does not contact emergency services or monitor messages.",
      reason: "Possible emergency",
      engine: "safety",
    };
  if (
    /ignore.*(instruction|policy|previous)|system prompt|pretend|override|disregard|reveal.*prompt/.test(
      q,
    )
  )
    return {
      status: "unanswered",
      text: "I can help you find Little Grove’s published policies. I cannot change policies or make exceptions in this conversation.",
      reason: "Unsupported instruction",
      engine: "safety",
    };
  if (
    /custody|court order|restraining|abuse|neglect|incident|injur|diagnos|dose|dosage|medicat|tylenol|ibuprofen|medical advice|rash|my (balance|bill|account)|owe|refund|credit card|social security|ssn|password|another (child|parent)|other (child|parent)|phone number of|address of/.test(
      q,
    )
  )
    return {
      status: "sensitive",
      text: "This needs a private conversation with the front office. I can’t access family records, give medical or legal advice, or make a decision about an individual child. Please use your usual private contact with the center. Personal details are not needed here.",
      reason: "Private or individual decision",
      engine: "safety",
    };
  if (
    /(my (child|son|daughter|baby)|she |he ).*(sick|fever|vomit|temperature|allerg|eat|return|come in|attend)|can (i|we).*(bring|send).*(sick|fever)|is it safe/.test(
      q,
    )
  )
    return {
      status: "sensitive",
      text: "Staff need to review your child’s situation directly. I can show the general attendance or meals policy, but I can’t say whether an individual child is safe to attend or eat a particular food. Contact the center and a healthcare professional for medical guidance.",
      reason: "Individual health question",
      engine: "safety",
    };
}
export function policyAnswer(
  policy: Policy,
  engine: Answer["engine"] = "policy",
  related = false,
): Answer {
  return {
    status: related ? "related" : "answered",
    text: policy.answer,
    policy: structuredClone(policy),
    reason: related
      ? "Related policy — confirm it covers your question"
      : "Published policy",
    engine,
  };
}
export function directAnswer(
  question: string,
  policies: Policy[],
): Answer | undefined {
  const safe = safetyAnswer(question);
  if (safe) return safe;
  const q = normalize(question).replace(/[?.!]+$/g, "");
  const matches = policies.filter(
    (p) =>
      p.published &&
      p.questions.some(
        (example) => normalize(example).replace(/[?.!]+$/g, "") === q,
      ),
  );
  if (matches.length > 1 && new Set(matches.map((p) => p.answer)).size > 1)
    return {
      status: "unanswered",
      text: "I found different published answers for this question. The front office needs to review them before I can give you a reliable answer.",
      reason: "Conflicting published answers",
      engine: "policy",
    };
  return matches[0] ? policyAnswer(matches[0]) : undefined;
}
export function keywordCandidates(
  question: string,
  policies: Policy[],
): Policy[] {
  const q = normalize(question);
  return policies
    .filter((p) => p.published)
    .map((p) => ({
      p,
      score: p.keywords.reduce(
        (sum, term) => sum + (q.includes(term) ? 1 : 0),
        0,
      ),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => item.p);
}
export function unknownAnswer(): Answer {
  return {
    status: "unanswered",
    text: "I don’t have a published answer for that yet. I’d rather leave it with the front office than guess. You can add this question to the demo staff queue, or browse the center’s policies below.",
    reason: "No sufficiently relevant published policy",
    engine: "policy",
  };
}
export function redactQuestion(question: string, answer: Answer): string {
  if (answer.status === "sensitive" || answer.status === "urgent")
    return `[${answer.reason} — details not retained]`;
  return question
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, "[email removed]")
    .replace(/(?:\+?\d[\d ()-]{7,}\d)/g, "[number removed]")
    .slice(0, 500);
}
