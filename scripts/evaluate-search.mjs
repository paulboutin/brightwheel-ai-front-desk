import { pipeline, env } from "@huggingface/transformers";
import { initialPolicies } from "../src/lib/data.ts";
import {
  MODEL_ID,
  MODEL_REVISION,
  eligiblePolicies,
  selectRelatedPolicy,
} from "../src/lib/retrieval.ts";
env.cacheDir = "./node_modules/.cache/transformers";
const model = await pipeline("feature-extraction", MODEL_ID, {
  dtype: "q8",
  revision: MODEL_REVISION,
});
const documents = initialPolicies.flatMap((p) =>
  [p.title, ...p.questions].map((text) => ({ id: p.id, text })),
);
const matrix = (
  await model(
    documents.map((d) => d.text),
    { pooling: "mean", normalize: true },
  )
).tolist();
const cases = [
  [
    "Can the teachers give prescribed medicine during the day?",
    "medication-policy",
  ],
  [
    "How would you notify families if the building needs to be evacuated?",
    "emergency-procedures",
  ],
  ["Do I need to put together a packed lunch each morning?", "meals"],
  ["How much would preschool set us back every month?", "tuition"],
  ["Could we look around the classrooms before signing up?", "tours"],
  ["When do you unlock the doors in the morning?", "hours"],
  ["What happens if traffic makes me late collecting my kid?", "pickup"],
  ["Do you take kids who are two years old?", "enrollment"],
  ["What is your snow day policy?", null],
  ["Are you open during winter break?", null],
  ["Can we pay tuition every week?", null],
  ["What is the teacher to child ratio?", null],
  ["What is your potty training policy?", null],
  ["Do children nap after lunch?", null],
  ["Can I get a sibling discount?", null],
  ["Who won the football game?", null],
  ["Is there a camera feed I can watch?", null],
  [
    "If my child needs assistance with eating lunch can I count on someone being there for her?",
    null,
  ],
];
let passed = 0;
for (const [question, expected] of cases) {
  const [q] = (
    await model(question, { pooling: "mean", normalize: true })
  ).tolist();
  const scores = {};
  matrix.forEach((v, i) => {
    const score = v.reduce((s, x, j) => s + x * q[j], 0);
    scores[documents[i].id] = Math.max(scores[documents[i].id] ?? -1, score);
  });
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const selected = selectRelatedPolicy(
    ranked.map(([policyId, score]) => ({ policyId, score })),
    eligiblePolicies(question, initialPolicies),
  );
  const actual = selected?.id ?? null;
  const pass = actual === expected;
  passed += Number(pass);
  console.log(
    JSON.stringify({
      question,
      expected,
      actual,
      pass,
      top: ranked.slice(0, 2),
    }),
  );
}
await model.dispose();

console.log(`${passed}/${cases.length} model retrieval cases passed.`);
if (passed !== cases.length) process.exitCode = 1;
