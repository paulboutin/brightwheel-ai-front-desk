import { describe, expect, it } from "vitest";
import { seedState } from "./data";
import { directAnswer, unknownAnswer } from "./answer";
import { eligiblePolicies } from "./retrieval";
import {
  cancelEmailReply,
  draftFaqFromReply,
  recordStaffReply,
  requestEmailReply,
  validEmail,
} from "./staff";
import type { Entry, StaffReply } from "./types";
const question =
  "If my child needs assistance with eating lunch can I count on someone being there for her?";
const entry: Entry = {
  id: "test",
  question,
  answer: unknownAnswer(),
  createdAt: "2026-10-07T00:00:00Z",
  review: "open",
  requested: false,
};
const reply: StaffReply = {
  id: "reply",
  text: "Teachers sit with children during lunch and offer age-appropriate help with utensils and packaging. Please discuss individual feeding needs with the director.",
  createdAt: entry.createdAt,
  delivery: "simulated",
};
const stateWith = (e: Entry) => ({ ...seedState(), entries: [e] });
describe("opt-in asynchronous follow-up", () => {
  it.each([
    "",
    "parent",
    "p@",
    "p@a",
    "a b@example.com",
    "a@example.com\r\nBcc:x@example.com",
  ])("rejects invalid email: %s", (value) =>
    expect(validEmail(value)).toBe(false),
  );
  it("keeps explicit consent and contact separate from the original question", () => {
    const requested = requestEmailReply(
      entry,
      " parent@example.com ",
      entry.createdAt,
    );
    expect(requested.question).toBe(question);
    expect(requested.emailFollowUp).toEqual({
      email: "parent@example.com",
      consentedAt: entry.createdAt,
      status: "pending",
    });
    expect(requested.review).toBe("open");
    expect(entry.emailFollowUp).toBeUndefined();
  });
  it("does not create requests for invalid addresses, emergencies, or old hidden questions", () => {
    expect(requestEmailReply(entry, "broken", entry.createdAt)).toBe(entry);
    const urgent = {
      ...entry,
      answer: { ...entry.answer, status: "urgent" as const },
    };
    expect(
      requestEmailReply(urgent, "parent@example.com", entry.createdAt),
    ).toBe(urgent);
    const hidden = {
      ...entry,
      question: "[Individual health question — details not retained]",
    };
    expect(
      requestEmailReply(hidden, "parent@example.com", entry.createdAt),
    ).toBe(hidden);
  });
  it("cancels pending requests and removes the address while retaining the question for improvement", () => {
    const canceled = cancelEmailReply(
      requestEmailReply(entry, "parent@example.com", entry.createdAt),
    );
    expect(canceled.emailFollowUp).toBeUndefined();
    expect(canceled.requested).toBe(false);
    expect(canceled.question).toBe(question);
    expect(
      recordStaffReply(stateWith(canceled), entry.id, reply).entries[0]
        .staffReplies,
    ).toBeUndefined();
  });
  it("cannot reply without consent or accidentally simulate delivery twice", () => {
    expect(recordStaffReply(stateWith(entry), entry.id, reply).entries[0]).toBe(
      entry,
    );
    const requested = requestEmailReply(
      entry,
      "parent@example.com",
      entry.createdAt,
    );
    const replied = recordStaffReply(stateWith(requested), entry.id, reply);
    expect(replied.entries[0].emailFollowUp?.status).toBe("simulated");
    expect(replied.entries[0].answer).toEqual(entry.answer);
    expect(replied.entries[0].review).toBe("resolved");
    expect(
      recordStaffReply(replied, entry.id, reply).entries[0].staffReplies,
    ).toHaveLength(1);
  });
});
describe("human-approved reuse", () => {
  it("only a published FAQ becomes a source, never the private reply or email", () => {
    const state = recordStaffReply(
      stateWith(
        requestEmailReply(entry, "parent@example.com", entry.createdAt),
      ),
      entry.id,
      reply,
    );
    expect(state.policies).toEqual(seedState().policies);
    expect(directAnswer(question, state.policies)).toBeUndefined();
    const draft = draftFaqFromReply(state.entries[0], "faq");
    expect(draft.answer).toBe(reply.text);
    expect(JSON.stringify(draft)).not.toContain("parent@example.com");
    expect(directAnswer(question, [...state.policies, draft])).toBeUndefined();
    expect(eligiblePolicies(question, [...state.policies, draft])).toHaveLength(
      0,
    );
    const published = {
      ...draft,
      published: true,
      title: "Help at mealtimes",
      version: 1,
    };
    expect(directAnswer(question, [...state.policies, published])?.text).toBe(
      reply.text,
    );
    expect(
      eligiblePolicies("Will staff help my daughter eat lunch?", [
        ...state.policies,
        published,
      ]),
    ).toEqual([published]);
  });
  it.each(["sensitive", "urgent"] as const)(
    "does not prefill family-specific %s replies into FAQs",
    (status) => {
      const draft = draftFaqFromReply(
        {
          ...entry,
          answer: { ...entry.answer, status },
          staffReplies: [reply],
        },
        "faq",
      );
      expect(draft.answer).toBe("");
      expect(draft.questions).toEqual([""]);
    },
  );
});

it("does not offer a public email request for a personal question", () => {
  const personal = {
    ...entry,
    answer: { ...entry.answer, status: "sensitive" as const },
  };
  expect(
    requestEmailReply(personal, "parent@example.com", entry.createdAt),
  ).toBe(personal);
});
