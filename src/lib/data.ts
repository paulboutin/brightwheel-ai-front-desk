import type { Policy, State } from "./types";
const base = {
  updatedAt: "2026-10-01T16:00:00.000Z",
  version: 1,
  published: true,
};
export const initialPolicies: Policy[] = [
  {
    ...base,
    id: "hours",
    title: "Hours & drop-off",
    category: "Daily essentials",
    answer:
      "Little Grove is open Monday–Friday, 7:30 am–5:30 pm. Please arrive by 9:00 am so your child can settle in before morning circle. If you will arrive later, let the front office know. We are closed on weekends.",
    questions: [
      "What time do you open and close?",
      "When should we arrive in the morning?",
      "Are you open on weekends?",
    ],
    keywords: [
      "hours",
      "open",
      "close",
      "closing",
      "drop off",
      "drop-off",
      "weekend",
      "arrive",
      "arrival",
    ],
  },
  {
    ...base,
    id: "tuition",
    title: "Tuition & billing",
    category: "Enrollment",
    answer:
      "Full-time monthly tuition is $1,650 for toddlers (18–35 months) and $1,450 for preschool (ages 3–5). Tuition includes lunch and two snacks. Payment is due on the 1st of each month. These are published rates; staff must confirm your family’s actual balance, discounts, or financial assistance.",
    questions: [
      "How much does preschool cost?",
      "What are the monthly fees?",
      "When is tuition due?",
    ],
    keywords: [
      "tuition",
      "cost",
      "price",
      "rates",
      "payment due",
      "fees",
      "billing",
    ],
  },
  {
    ...base,
    id: "illness",
    title: "Staying home when sick",
    category: "Health & safety",
    answer:
      "Our fictional center policy asks children to stay home with a fever of 100.4°F or higher, vomiting, or diarrhea. Children may return after 24 hours free of these symptoms without symptom-reducing medicine. Staff may request guidance from a healthcare professional. This is an attendance policy, not a diagnosis or clearance for an individual child.",
    questions: [
      "What is your sick policy?",
      "How long must children be fever free?",
      "When can children return after vomiting?",
    ],
    keywords: [
      "sick",
      "illness",
      "fever",
      "vomit",
      "diarrhea",
      "symptom",
      "temperature",
    ],
  },
  {
    ...base,
    id: "meals",
    title: "Meals & food allergies",
    category: "Daily essentials",
    answer:
      "We serve a morning snack, lunch, and an afternoon snack, all included in tuition. Our center is nut-aware, but we cannot guarantee an allergen-free environment. Please do not send food containing peanuts or tree nuts. Individual allergies and dietary accommodations must be reviewed with staff before your child attends.",
    questions: [
      "Is lunch included?",
      "Do I need to pack food?",
      "How do you handle food allergies?",
    ],
    keywords: ["lunch", "snack", "food", "meal", "nut", "allerg", "diet"],
  },
  {
    ...base,
    id: "tours",
    title: "Visiting Little Grove",
    category: "Enrollment",
    answer:
      "Tours are offered Tuesday and Thursday at 10:00 am by appointment. A tour lasts about 30 minutes, and children are welcome to join. Contact the front office to request a time. A tour request is not a confirmed reservation; staff will confirm availability.",
    questions: [
      "Can we visit before enrolling?",
      "How can I schedule a tour?",
      "Can my child come on the tour?",
    ],
    keywords: ["tour", "visit", "look around", "see the school"],
  },
  {
    ...base,
    id: "pickup",
    title: "Pickup & authorized adults",
    category: "Health & safety",
    answer:
      "Pickup is by 5:30 pm. Only adults on your child’s authorized pickup list may collect them, and staff check photo ID. Contact the office directly to request a change; this front desk cannot authorize a new person. A late fee of $15 per 15 minutes begins at 5:35 pm. If you are running late, contact the office.",
    questions: [
      "Who can pick up my child?",
      "What happens if I am late for pickup?",
      "Do adults need photo ID?",
    ],
    keywords: ["pickup", "pick up", "pick-up", "late", "collect", "photo id"],
  },
  {
    ...base,
    id: "enrollment",
    title: "Ages & enrollment",
    category: "Enrollment",
    answer:
      "Little Grove welcomes toddlers from 18 months and preschoolers ages 3–5. We offer full-time enrollment, Monday–Friday. Staff confirm available spaces and start dates after a tour. Joining the interest list does not guarantee a place.",
    questions: [
      "What ages do you accept?",
      "Do you accept two year olds?",
      "Do you have part-time places?",
      "Are there any spots available?",
    ],
    keywords: [
      "enroll",
      "age",
      "space",
      "spot",
      "waitlist",
      "part-time",
      "part time",
      "start date",
    ],
  },
  {
    ...base,
    id: "emergency-procedures",
    title: "Emergency procedures & family updates",
    category: "Health & safety",
    answer:
      "Little Grove’s fictional emergency plan covers evacuation, shelter-in-place, and family reunification. Staff account for children, contact emergency services when needed, and notify authorized guardians through the parent portal and emergency contact numbers on file. Families receive pickup instructions from staff; please do not arrive at an evacuation location until directed. Keep emergency contacts current in your parent portal. For an emergency happening now, call local emergency services rather than waiting for a chat reply.",
    questions: [
      "What is your emergency procedure?",
      "What are your emergency procedures?",
      "How does the center handle emergencies?",
      "How are parents notified in an emergency?",
      "What happens during an evacuation?",
      "What is your emergency plan?",
    ],
    keywords: [
      "emergency",
      "evacuat",
      "shelter",
      "reunification",
      "emergency contact",
      "notify parents",
    ],
  },
  {
    ...base,
    id: "medication-policy",
    title: "Medication administration",
    category: "Health & safety",
    answer:
      "At fictional Little Grove, designated trained staff may administer medication only after the director has reviewed the required written parent authorization and healthcare-provider instructions. Medication must arrive in its original labeled container and be handed directly to staff; it must not be left in a child’s bag. Staff store it securely and document administration. Send a request about your enrolled child through the authenticated parent portal so staff can review the individual plan. This public front desk cannot approve medication, select a dose, or change a care plan.",
    questions: [
      "Does the center administer medication?",
      "Do you give children medication?",
      "What is your medication policy?",
      "What paperwork is needed for medication?",
      "How should medicine be dropped off?",
      "How do staff store medication?",
    ],
    keywords: [
      "medication",
      "medicine",
      "administer",
      "authorization",
      "prescription",
      "medical form",
    ],
  },
];
export function seedState(): State {
  return {
    schema: 1,
    policies: structuredClone(initialPolicies),
    entries: [
      {
        id: "sample-1",
        question: "Are you open during winter break?",
        answer: {
          status: "unanswered",
          text: "I don’t have a published holiday calendar to answer that yet.",
          reason: "Missing holiday policy",
          engine: "policy",
        },
        createdAt: "2026-10-06T16:20:00.000Z",
        review: "open",
        requested: false,
        sample: true,
      },
      {
        id: "sample-2",
        question: "What time do you open and close?",
        answer: {
          status: "answered",
          text: initialPolicies[0].answer,
          policy: structuredClone(initialPolicies[0]),
          reason: "Published policy",
          engine: "policy",
        },
        createdAt: "2026-10-06T15:40:00.000Z",
        review: "resolved",
        requested: false,
        feedback: "helpful",
        sample: true,
      },
      {
        id: "sample-3",
        question: "Can we pay tuition every week?",
        answer: {
          status: "unanswered",
          text: "Weekly payment arrangements need confirmation from the office.",
          reason: "Payment exception needs staff",
          engine: "policy",
        },
        createdAt: "2026-10-06T14:30:00.000Z",
        review: "open",
        requested: false,
        sample: true,
      },
    ],
  };
}
