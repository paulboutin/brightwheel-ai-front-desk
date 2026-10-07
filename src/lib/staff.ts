import type { Entry, Policy, StaffReply, State } from "./types";
export const validEmail = (value: string) =>
  value.trim().length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
export function requestEmailReply(
  entry: Entry,
  email: string,
  consentedAt: string,
): Entry {
  if (
    !validEmail(email) ||
    entry.answer.status === "urgent" ||
    hasHiddenQuestion(entry)
  )
    return entry;
  return {
    ...entry,
    requested: true,
    review: "open",
    emailFollowUp: { email: email.trim(), consentedAt, status: "pending" },
  };
}
export function cancelEmailReply(entry: Entry): Entry {
  if (entry.emailFollowUp?.status !== "pending") return entry;
  const { emailFollowUp: _removed, ...rest } = entry;
  return { ...rest, requested: false };
}
export const hasHiddenQuestion = (entry: Entry) =>
  entry.question.includes("details not retained]");
export function recordStaffReply(
  state: State,
  entryId: string,
  reply: StaffReply,
): State {
  if (!reply.text.trim()) return state;
  return {
    ...state,
    entries: state.entries.map((entry) =>
      entry.id === entryId && entry.emailFollowUp?.status === "pending"
        ? {
            ...entry,
            staffReplies: [
              ...(entry.staffReplies ?? []),
              { ...reply, text: reply.text.trim() },
            ],
            review: "resolved",
            emailFollowUp: { ...entry.emailFollowUp, status: "simulated" },
          }
        : entry,
    ),
  };
}
export function draftFaqFromReply(entry: Entry, id: string): Policy {
  // Sensitive replies need a separately written, general answer. Never silently
  // seed family-specific health or account details into a reusable source.
  const needsGeneralAnswer =
    ["sensitive", "urgent"].includes(entry.answer.status) ||
    hasHiddenQuestion(entry);
  return {
    id,
    title: "",
    category: "Daily essentials",
    answer: needsGeneralAnswer ? "" : (entry.staffReplies?.at(-1)?.text ?? ""),
    questions: needsGeneralAnswer ? [""] : [entry.question],
    keywords: [],
    updatedAt: "",
    version: 0,
    published: false,
  };
}
