export type Policy = {
  id: string;
  title: string;
  category: string;
  answer: string;
  questions: string[];
  keywords: string[];
  updatedAt: string;
  version: number;
  published: boolean;
};
export type Answer = {
  status: "answered" | "related" | "unanswered" | "sensitive" | "urgent";
  text: string;
  policy?: Policy;
  reason: string;
  engine: "policy" | "semantic" | "safety";
};
export type StaffReply = {
  id: string;
  text: string;
  createdAt: string;
  delivery: "simulated";
};
export type EmailFollowUp = {
  email: string;
  consentedAt: string;
  status: "pending" | "simulated";
};
export type Entry = {
  id: string;
  question: string;
  answer: Answer;
  createdAt: string;
  feedback?: "helpful" | "unhelpful";
  review: "open" | "resolved";
  requested: boolean;
  sample?: boolean;
  privacyRedirect?: boolean;
  staffReplies?: StaffReply[];
  emailFollowUp?: EmailFollowUp;
  faqPolicyId?: string;
};
export type State = { schema: 1; policies: Policy[]; entries: Entry[] };
