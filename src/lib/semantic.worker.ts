import {
  env,
  pipeline,
  type FeatureExtractionPipeline,
} from "@huggingface/transformers";
import type { Policy } from "./types";
import { MODEL_ID, MODEL_REVISION } from "./retrieval";
env.allowLocalModels = false;
if (env.backends.onnx.wasm) env.backends.onnx.wasm.numThreads = 1;
let extractor: FeatureExtractionPipeline;
let signature = "";
let vectors: number[][] = [];
let mapping: string[] = [];
let queue = Promise.resolve();
self.onmessage = (
  event: MessageEvent<{ id: string; question: string; policies: Policy[] }>,
) => {
  queue = queue.then(async () => {
    const { id, question, policies } = event.data;
    try {
      if (!extractor) {
        self.postMessage({ id, status: "loading" });
        extractor = await pipeline("feature-extraction", MODEL_ID, {
          dtype: "q8",
          device: "wasm",
          revision: MODEL_REVISION,
        });
      }
      const current = JSON.stringify(
        policies.map((p) => [
          p.id,
          p.version,
          p.questions,
          p.title,
          p.published,
        ]),
      );
      if (signature !== current) {
        const texts: string[] = [];
        mapping = [];
        for (const p of policies.filter((p) => p.published))
          for (const q of [p.title, ...p.questions]) {
            texts.push(q);
            mapping.push(p.id);
          }
        if (texts.length)
          vectors = (
            await extractor(texts, { pooling: "mean", normalize: true })
          ).tolist();
        else vectors = [];
        signature = current;
      }
      const [query] = (
        await extractor(question, { pooling: "mean", normalize: true })
      ).tolist() as number[][];
      const scores: Record<string, number> = {};
      vectors.forEach((vector, index) => {
        const score = vector.reduce(
          (sum, value, j) => sum + value * query[j],
          0,
        );
        scores[mapping[index]] = Math.max(scores[mapping[index]] ?? -1, score);
      });
      self.postMessage({
        id,
        status: "ready",
        matches: Object.entries(scores)
          .map(([policyId, score]) => ({ policyId, score }))
          .sort((a, b) => b.score - a.score),
      });
    } catch {
      self.postMessage({ id, status: "error" });
    }
  });
};
