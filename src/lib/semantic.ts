import type { Policy } from "./types";
import type { Match } from "./retrieval";
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
    function cleanup() {
      clearTimeout(timeout);
      active.removeEventListener("message", listener);
      active.removeEventListener("error", onError);
    }
    function onError() {
      cleanup();
      active.terminate();
      if (worker === active) worker = undefined;
      reject(new Error("AI search unavailable"));
    }
    const timeout = setTimeout(onError, 45000);
    function listener(event: MessageEvent) {
      if (event.data.id !== id) return;
      if (event.data.status === "loading") {
        onLoading();
        return;
      }
      cleanup();
      if (event.data.status === "error")
        reject(new Error("AI search unavailable"));
      else resolve(event.data.matches);
    }
    active.addEventListener("message", listener);
    active.addEventListener("error", onError);
    active.postMessage({ id, question, policies });
  });
}
