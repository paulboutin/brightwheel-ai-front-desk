import { describe, expect, it } from "vitest";
import { initialPolicies } from "./data";
import { eligiblePolicies, selectRelatedPolicy } from "./retrieval";
describe("retrieval abstention", () => {
  it.each([
    "What is your snow day policy?",
    "Are you open during winter break?",
    "Can we pay tuition every week?",
    "What is the teacher to child ratio?",
    "What is your potty training policy?",
    "Do children nap after lunch?",
    "Is there a camera feed?",
    "If my child needs assistance with eating lunch can I count on someone being there for her?",
  ])("abstains on an uncovered specific topic: %s", (q) => {
    expect(eligiblePolicies(q, initialPolicies)).toHaveLength(0);
  });
  it("allows a new operator policy to cover the previously missing topic", () => {
    const policy = {
      ...initialPolicies[0],
      id: "holidays",
      title: "Holidays",
      answer: "We close for winter break from December 24 through January 1.",
    };
    expect(
      eligiblePolicies("Are you open during winter break?", [
        ...initialPolicies,
        policy,
      ]),
    ).toEqual([policy]);
  });
  it("rejects low relevance and ambiguous results", () => {
    expect(
      selectRelatedPolicy([{ policyId: "hours", score: 0.5 }], initialPolicies),
    ).toBeUndefined();
    expect(
      selectRelatedPolicy(
        [
          { policyId: "hours", score: 0.7 },
          { policyId: "pickup", score: 0.65 },
        ],
        initialPolicies,
      ),
    ).toBeUndefined();
  });
  it("accepts a distinct related policy without interpreting similarity as confidence", () => {
    expect(
      selectRelatedPolicy(
        [
          { policyId: "meals", score: 0.66 },
          { policyId: "hours", score: 0.49 },
        ],
        initialPolicies,
      )?.id,
    ).toBe("meals");
  });
});
