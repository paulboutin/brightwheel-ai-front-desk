import { afterEach, beforeEach, expect, it, vi } from "vitest";
class FakeWorker {
  static instances: FakeWorker[] = [];
  listeners: Record<string, ((event: unknown) => void)[]> = {};
  payload = { id: "" };
  terminate = vi.fn();
  constructor() {
    FakeWorker.instances.push(this);
  }
  addEventListener(type: string, fn: (event: unknown) => void) {
    (this.listeners[type] ??= []).push(fn);
  }
  removeEventListener(type: string, fn: (event: unknown) => void) {
    this.listeners[type] = (this.listeners[type] ?? []).filter(
      (listener) => listener !== fn,
    );
  }
  postMessage(payload: { id: string }) {
    this.payload = payload;
  }
  emit(type: string, data: unknown = {}) {
    [...(this.listeners[type] ?? [])].forEach((fn) => fn({ data }));
  }
}
beforeEach(() => {
  vi.resetModules();
  vi.useFakeTimers();
  FakeWorker.instances = [];
  vi.stubGlobal("Worker", FakeWorker);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
it("matches responses to the request and announces model initialization", async () => {
  const { semanticSearch } = await import("./semantic");
  const onLoading = vi.fn();
  const result = semanticSearch("lunch?", [], onLoading);
  const worker = FakeWorker.instances[0];
  worker.emit("message", { id: worker.payload.id, status: "loading" });
  expect(onLoading).toHaveBeenCalledOnce();
  worker.emit("message", {
    id: worker.payload.id,
    status: "ready",
    matches: [{ policyId: "meals", score: 0.8 }],
  });
  await expect(result).resolves.toEqual([{ policyId: "meals", score: 0.8 }]);
  expect(worker.listeners.message).toHaveLength(0);
  expect(vi.getTimerCount()).toBe(0);
});
it("rejects model failures so the caller can use basic search", async () => {
  const { semanticSearch } = await import("./semantic");
  const result = semanticSearch("lunch?", [], vi.fn());
  const worker = FakeWorker.instances[0];
  const assertion = expect(result).rejects.toThrow("AI search unavailable");
  worker.emit("message", { id: worker.payload.id, status: "error" });
  await assertion;
  expect(vi.getTimerCount()).toBe(0);
});
it("terminates a stalled worker after 45 seconds and permits a fresh attempt", async () => {
  const { semanticSearch } = await import("./semantic");
  const result = semanticSearch("lunch?", [], vi.fn());
  const assertion = expect(result).rejects.toThrow("AI search unavailable");
  await vi.advanceTimersByTimeAsync(45000);
  await assertion;
  expect(FakeWorker.instances[0].terminate).toHaveBeenCalledOnce();
  const retry = semanticSearch("lunch?", [], vi.fn());
  const worker = FakeWorker.instances[1];
  worker.emit("message", {
    id: worker.payload.id,
    status: "ready",
    matches: [],
  });
  await expect(retry).resolves.toEqual([]);
});
it("fails immediately on a worker crash", async () => {
  const { semanticSearch } = await import("./semantic");
  const result = semanticSearch("lunch?", [], vi.fn());
  const assertion = expect(result).rejects.toThrow("AI search unavailable");
  FakeWorker.instances[0].emit("error");
  await assertion;
  expect(FakeWorker.instances[0].terminate).toHaveBeenCalledOnce();
  expect(vi.getTimerCount()).toBe(0);
});
