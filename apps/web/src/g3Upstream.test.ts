import { describe, expect, it } from "vite-plus/test";

import {
  buildUpstreamUpdatePrompt,
  fetchUpstreamCommitsBehind,
  hasDraftAutoSend,
  parseCompareAheadBy,
  requestDraftAutoSend,
  takeDraftAutoSend,
} from "./g3Upstream";

describe("parseCompareAheadBy", () => {
  it("reads a non-negative integer", () => {
    expect(parseCompareAheadBy({ ahead_by: 12 })).toBe(12);
    expect(parseCompareAheadBy({ ahead_by: 0 })).toBe(0);
  });

  it("rejects anything else", () => {
    expect(parseCompareAheadBy(null)).toBeNull();
    expect(parseCompareAheadBy({})).toBeNull();
    expect(parseCompareAheadBy({ ahead_by: -1 })).toBeNull();
    expect(parseCompareAheadBy({ ahead_by: "3" })).toBeNull();
  });
});

describe("fetchUpstreamCommitsBehind", () => {
  it("asks GitHub to compare the merged commit with upstream main", async () => {
    const urls: string[] = [];
    const fetchImpl = (async (url: string) => {
      urls.push(url);
      return new Response(JSON.stringify({ ahead_by: 7 }), { status: 200 });
    }) as unknown as typeof fetch;
    await expect(fetchUpstreamCommitsBehind("abc1234", fetchImpl)).resolves.toBe(7);
    expect(urls).toEqual(["https://api.github.com/repos/pingdotgg/t3code/compare/abc1234...main"]);
  });

  it("returns null for a bad base, an error status or a network failure", async () => {
    const notFound = (async () => new Response("", { status: 404 })) as unknown as typeof fetch;
    const offline = (async () => {
      throw new Error("offline");
    }) as unknown as typeof fetch;
    await expect(fetchUpstreamCommitsBehind("", notFound)).resolves.toBeNull();
    await expect(fetchUpstreamCommitsBehind("abc1234", notFound)).resolves.toBeNull();
    await expect(fetchUpstreamCommitsBehind("abc1234", offline)).resolves.toBeNull();
  });
});

describe("buildUpstreamUpdatePrompt", () => {
  it("names the count, the checkout and the steps", () => {
    const prompt = buildUpstreamUpdatePrompt({ behind: 3, sourceDir: "/src/g3" });
    expect(prompt).toContain("3 commits behind");
    expect(prompt).toContain("In /src/g3, on branch `g3`");
    expect(prompt).toContain("Do not quit or kill G3");
  });
});

describe("draft auto-send", () => {
  it("fires once per marked draft", () => {
    requestDraftAutoSend("draft-1");
    expect(hasDraftAutoSend("draft-1")).toBe(true);
    expect(takeDraftAutoSend("draft-1")).toBe(true);
    expect(takeDraftAutoSend("draft-1")).toBe(false);
    expect(hasDraftAutoSend("draft-2")).toBe(false);
  });
});
