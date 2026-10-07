import type { Policy } from "./types";
export type Match = { policyId: string; score: number };
let worker: Worker | undefined;
export function semanticSearch(
  question: string,
  policies: Policy[],
  onLoading: () => void,
): Promise<Match[]> {
  worker ??= new Worker(new URL("./semantic.worker.ts", import.meta.url), {
    type: "module",
  });
  const active = worker;
  return new Promise((resolve, reject) => {
    const id = crypto.randomUUID();
    const timeout = setTimeout(() => {
      active.removeEventListener("message", listener);
      active.terminate();
      if (worker === active) worker = undefined;
      reject(new Error("AI search timed out"));
    }, 45000);
    function listener(event: MessageEvent) {
      if (event.data.id !== id) return;
      if (event.data.status === "loading") {
        onLoading();
        return;
      }
      clearTimeout(timeout);
      active.removeEventListener("message", listener);
      if (event.data.status === "error")
        reject(new Error("AI search unavailable"));
      else resolve(event.data.matches);
    }
    active.addEventListener("message", listener);
    active.postMessage({ id, question, policies });
  });
}
