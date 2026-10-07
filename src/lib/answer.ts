import type { Answer, Policy } from "./types";
export const normalize = (text: string) =>
  text.toLowerCase().normalize("NFKC").replace(/[’]/g, "'").trim();
export function safetyAnswer(question: string): Answer | undefined {
  const q = normalize(question);
  // Recognize reports of immediate danger, not the word "emergency" alone.
  // A general policy clause never cancels an explicit report of danger.
  if (
    /\b(can't breathe|cannot breathe|not breathing|trouble breathing|is choking|is unconscious|is unresponsive|having a seizure|immediate danger|this is an emergency|emergency (right )?now)\b/.test(
      q,
    ) ||
    /^(help[!, ]*)?emergency[!. ]*$/.test(q) ||
    (/\b(choking|unconscious|unresponsive|seizure)\b/.test(q) &&
      (!/\b(policy|procedures?|training|plan|protocol|drills?)\b/.test(q) ||
        /\bmy (child|son|daughter|baby|toddler)\b/.test(q)))
  )
    return {
      status: "urgent",
      text: "If someone is in immediate danger, call your local emergency number now (911 in the US). Do not wait for a teacher, portal message, or email reply. This public demo does not contact emergency services or monitor messages.",
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
  // These are routing hints, not identity verification or comprehensive name detection.
  const potentialName =
    /\b(?:my (?:child|son|daughter|baby|toddler)(?: is named| named|,)?|(?:Did|Has|Is|Was|Can|Could|Will))\s+[A-Z][\p{L}'’-]+(?:\s|,)/u.exec(
      question,
    )?.[0] ||
    /\b[A-Z][\p{L}'’-]+ (?:has|needs|takes|is feeling|was hurt|ate|didn't eat|can't|cannot)\b/u.exec(
      question,
    )?.[0];
  const namedChild =
    !!potentialName &&
    !/\b(You|Your|Our|The|This|There|Children|Gluten|Nut|Peanut|Food|Lunch|Staff|School|Center)\b/.test(
      potentialName,
    );
  const individualHealth =
    /\b(injur\w*|hurt|sick|ill|fever|vomit\w*|throwing up|diarrhea|temperature|allerg\w*|symptoms?|contagious|rash|medicat\w*|prescription|feeding tube|dysphagia|celiac|coeliac|intoleran\w*|anaphyla\w*)\b/.test(
      q,
    ) &&
    (/\b(my (child|son|daughter|baby|toddler)|she|he|his|her)\b|can (i|we).*(bring|send)/.test(
      q,
    ) ||
      namedChild ||
      /\b(has|have) (a )?(fever|rash)|throwing up/.test(q));
  const clinicalDecision =
    /\b(dose|dosage|medical advice|diagnos\w*)\b|how much.*(tylenol|ibuprofen|medicine|medication)|should (i|we).*(give|treat)/.test(
      q,
    );
  const personalRecord =
    /\b(custody|court order|restraining|abuse|neglect|my (balance|bill|account)|owe|refund|credit card|social security|ssn|password|another (child|parent)|other (child|parent)|phone number of|address of)\b/.test(
      q,
    ) ||
    /\b(did|has|is|was) my (child|son|daughter|baby|toddler)\b|\b(how is|what did) my (child|son|daughter|baby|toddler)\b/.test(
      q,
    );
  if (namedChild || individualHealth || clinicalDecision || personalRecord)
    return {
      status: "sensitive",
      text: "This public front desk answers general center-policy questions. For a question about your enrolled child, sign in to your center’s existing parent portal and message the teacher or office. Sign in and select your child so the teacher has the right context. No message has been forwarded from this demo. Please don’t enter names, health details, or family records here. For medical decisions, contact an appropriate healthcare professional.",
      reason: "Use authenticated parent portal",
      engine: "safety",
    };
}
export const isPrivateRoute = (answer: Answer) =>
  ["sensitive", "urgent"].includes(answer.status);
export function publicQuestion(question: string, answer: Answer): string {
  // The public demo cannot offer secure delivery to teachers. Keep only routing
  // metadata here; personal context belongs in the family's authenticated portal.
  if (isPrivateRoute(answer))
    return answer.status === "urgent"
      ? "Urgent guidance shown — personal details not saved"
      : "Personal question — continue in the parent portal";
  return redactQuestion(question);
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
    text: "I don’t have a published answer for that yet. I’d rather leave it with the front office than guess. You can request an email reply from staff when they’re available, or choose another topic above. For questions about your enrolled child, use your center’s authenticated parent portal. Email delivery is simulated in this demo.",
    reason: "No sufficiently relevant published policy",
    engine: "policy",
  };
}
// Preserve the question for human review, regardless of its routing category.
// This demo is browser-local; these limited patterns are not a privacy guarantee.
export function redactQuestion(question: string): string {
  return question
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, "[email removed]")
    .replace(/(?:\+?\d[\d ()-]{7,}\d)/g, "[number removed]")
    .slice(0, 500);
}
