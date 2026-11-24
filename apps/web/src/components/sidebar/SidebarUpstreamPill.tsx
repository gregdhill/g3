import { scopeProjectRef } from "@t3tools/client-runtime/environment";
import { ArrowUpCircleIcon } from "lucide-react";
import { useGT } from "gt-react";
import { useEffect, useState } from "react";

import {
  buildUpstreamUpdatePrompt,
  fetchUpstreamCommitsBehind,
  G3_SOURCE_DIR,
  G3_UPSTREAM_BASE,
  requestDraftAutoSend,
} from "~/g3Upstream";
import { useNewThreadHandler } from "~/hooks/useHandleNewThread";
import { useProjects } from "~/state/entities";
import { usePrimaryEnvironmentId } from "~/state/environments";
import { Tooltip, TooltipPopup, TooltipTrigger } from "../ui/tooltip";

const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
const CACHE_KEY = "g3:upstream-behind";

type CachedCount = { readonly base: string; readonly behind: number; readonly checkedAt: number };

function readCachedCount(): CachedCount | null {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(CACHE_KEY) ?? "null");
    if (typeof parsed !== "object" || parsed === null) return null;
    const { base, behind, checkedAt } = parsed as Partial<CachedCount>;
    return base === G3_UPSTREAM_BASE && typeof behind === "number" && typeof checkedAt === "number"
      ? { base, behind, checkedAt }
      : null;
  } catch {
    return null;
  }
}

function writeCachedCount(behind: number): void {
  try {
    const value: CachedCount = { base: G3_UPSTREAM_BASE, behind, checkedAt: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(value));
  } catch {
    // Storage can be unavailable; the next check asks GitHub again.
  }
}

function useUpstreamCommitsBehind(): number | null {
  const [behind, setBehind] = useState<number | null>(() => readCachedCount()?.behind ?? null);
  // oxlint-disable-next-line t3code/no-unreasoned-state-sync -- polls GitHub for upstream commits on a timer
  useEffect(() => {
    if (G3_UPSTREAM_BASE === "") return;
    let cancelled = false;
    const check = async () => {
      const cached = readCachedCount();
      if (cached !== null && Date.now() - cached.checkedAt < CHECK_INTERVAL_MS) {
        setBehind(cached.behind);
        return;
      }
      const next = await fetchUpstreamCommitsBehind(G3_UPSTREAM_BASE);
      if (cancelled || next === null) return;
      writeCachedCount(next);
      setBehind(next);
    };
    void check();
    const interval = window.setInterval(() => void check(), CHECK_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);
  return behind;
}

/** Says how many upstream T3 Code commits G3 lacks; clicking starts a chat that merges them. */
export function SidebarUpstreamPill() {
  const gt = useGT();
  const behind = useUpstreamCommitsBehind();
  const primaryEnvironmentId = usePrimaryEnvironmentId();
  const projects = useProjects();
  const handleNewThread = useNewThreadHandler();
  const chatsProject =
    projects.find(
      (project) => project.environmentId === primaryEnvironmentId && project.title === "Chats",
    ) ??
    projects.find((project) => project.environmentId === primaryEnvironmentId) ??
    null;

  if (behind === null || behind === 0 || chatsProject === null) return null;

  const startUpdate = async () => {
    const created = await handleNewThread(
      scopeProjectRef(chatsProject.environmentId, chatsProject.id),
      { prompt: buildUpstreamUpdatePrompt({ behind, sourceDir: G3_SOURCE_DIR }) },
    );
    if (created !== null) requestDraftAutoSend(created.draftId);
  };

  const label = gt(
    "{count, plural, one {# commit behind T3 Code} other {# commits behind T3 Code}}",
    { count: behind },
  );
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            className="flex min-h-7 w-full shrink-0 items-center gap-2 rounded-lg bg-sidebar-control-surface px-2 py-1.5 text-left text-2xs leading-4 font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-row-hover"
            onClick={() => void startUpdate()}
          >
            <ArrowUpCircleIcon className="size-3.5 shrink-0" />
            <span className="min-w-0 flex-1 truncate">{label}</span>
            <span className="shrink-0 text-sidebar-muted-foreground">{gt("Update")}</span>
          </button>
        }
      />
      <TooltipPopup side="top">
        {gt("Start a chat that merges upstream T3 Code into G3 and rebuilds the app.")}
      </TooltipPopup>
    </Tooltip>
  );
}
