/**
 * G3 is a fork of T3 Code. The build records the last upstream commit it merged, so the app can
 * say how far behind upstream it is and start a chat that merges the rest.
 */

const G3_UPSTREAM_REPOSITORY = "pingdotgg/t3code";
const G3_UPSTREAM_BRANCH = "main";
export const G3_UPSTREAM_BASE: string = import.meta.env.VITE_G3_UPSTREAM_BASE ?? "";
export const G3_SOURCE_DIR: string = import.meta.env.VITE_G3_SOURCE_DIR ?? "";

/** Reads `ahead_by` from a GitHub compare response: upstream commits the build does not have. */
export function parseCompareAheadBy(body: unknown): number | null {
  if (typeof body !== "object" || body === null || !("ahead_by" in body)) return null;
  const aheadBy = body.ahead_by;
  return typeof aheadBy === "number" && Number.isInteger(aheadBy) && aheadBy >= 0 ? aheadBy : null;
}

/** Counts upstream commits since `base`, or null when GitHub cannot say. */
export async function fetchUpstreamCommitsBehind(
  base: string,
  fetchImpl: typeof fetch = fetch,
): Promise<number | null> {
  if (!/^[0-9a-f]{7,40}$/.test(base)) return null;
  const url = `https://api.github.com/repos/${G3_UPSTREAM_REPOSITORY}/compare/${base}...${G3_UPSTREAM_BRANCH}`;
  try {
    const response = await fetchImpl(url, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!response.ok) return null;
    return parseCompareAheadBy(await response.json());
  } catch {
    return null;
  }
}

/** The first message of the chat that brings G3 up to date with upstream. */
export function buildUpstreamUpdatePrompt(input: {
  readonly behind: number;
  readonly sourceDir: string;
}): string {
  const dir = input.sourceDir === "" ? "the G3 checkout (~/Code/g3)" : input.sourceDir;
  return [
    `G3 is ${input.behind} commits behind upstream T3 Code (${G3_UPSTREAM_REPOSITORY} ${G3_UPSTREAM_BRANCH}). Bring it up to date:`,
    "",
    `1. In ${dir}, on branch \`g3\`, check the working tree is clean, then \`git fetch upstream\`.`,
    `2. Merge \`upstream/${G3_UPSTREAM_BRANCH}\` into \`g3\`. Resolve conflicts in favour of G3's changes: no projects in the UI (one hidden "Chats" project), G3 branding and icons, the ~/.g3 data dir, the chats folder setting, the hidden project/worktree/PR controls (apps/web/src/g3Ui.ts), the upstream notice, and the VS Code theme. The deleted mobile and marketing apps stay deleted.`,
    "3. Follow ~/Code/agents/projects/g3.md for the toolchain. Run `vp i`, typecheck apps/web and apps/server, run `vp run i18n:generate` in apps/web, and fix anything the pre-commit hooks report. Never skip the hooks.",
    "4. Commit the merge (signed) and push `g3` to origin.",
    "5. Build the macOS app with `RUSTUP_TOOLCHAIN=1.100.0 vp run dist:desktop:dmg:arm64` and replace /Applications/G3.app with the G3.app from the new DMG. Do not quit or kill G3: this chat runs inside it.",
    "",
    "Finish with a few lines on what changed upstream, and tell me to restart G3.",
  ].join("\n");
}

const autoSendDraftIds = new Set<string>();

/** Fired on window when a draft is marked, since its chat view may already be showing. */
export const G3_DRAFT_AUTO_SEND_EVENT = "g3:draft-auto-send";

/** Marks a new draft to send its prefilled prompt from its chat view. */
export function requestDraftAutoSend(draftId: string): void {
  autoSendDraftIds.add(draftId);
  if (typeof window !== "undefined") window.dispatchEvent(new Event(G3_DRAFT_AUTO_SEND_EVENT));
}

/** Whether a draft still waits to send its prompt. */
export function hasDraftAutoSend(draftId: string): boolean {
  return autoSendDraftIds.has(draftId);
}

/** True once for a draft marked by `requestDraftAutoSend`. */
export function takeDraftAutoSend(draftId: string): boolean {
  return autoSendDraftIds.delete(draftId);
}
