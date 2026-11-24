import { resolvePastedPath } from "@t3tools/shared/path";
import { useGT } from "gt-react";

import { reportProjectFailure } from "../../hooks/useProjectGroupUpdate";
import { useProjects } from "../../state/entities";
import { usePrimaryEnvironmentId } from "../../state/environments";
import { projectEnvironment } from "../../state/projects";
import { useOrchestrationCommand } from "../../state/use-orchestration-command";
import { DraftInput } from "../ui/draft-input";
import { SettingsRow, SettingsSection } from "./settingsLayout";

/** The server creates one project per machine for G3 chats; it is titled "Chats". */
const G3_CHATS_PROJECT_TITLE = "Chats";

/** Where G3 chats run: the folder of the hidden project every chat belongs to. */
export function ChatsFolderSettings() {
  const gt = useGT();
  const primaryEnvironmentId = usePrimaryEnvironmentId();
  const projects = useProjects();
  const updateProject = useOrchestrationCommand(projectEnvironment.update, {
    reportFailure: false,
  });
  const machineProjects = projects.filter(
    (project) => project.environmentId === primaryEnvironmentId,
  );
  const chatsProject =
    machineProjects.find((project) => project.title === G3_CHATS_PROJECT_TITLE) ??
    machineProjects[0] ??
    null;

  if (chatsProject === null) return null;

  const commit = async (next: string) => {
    const workspaceRoot = next.trim();
    if (workspaceRoot === "" || workspaceRoot === chatsProject.workspaceRoot) return;
    const result = await updateProject({
      environmentId: chatsProject.environmentId,
      input: { projectId: chatsProject.id, workspaceRoot },
    });
    reportProjectFailure(gt("Failed to change the chats folder"), result);
  };

  return (
    <SettingsSection id="chats" title={gt("Chats")}>
      <SettingsRow
        id="chats-folder"
        title={gt("Chats folder")}
        description={gt(
          "Every chat and terminal starts in this folder. The G3_CHATS_DIR environment variable overrides it.",
        )}
        control={
          <DraftInput
            size="sm"
            className="w-full sm:w-72"
            value={chatsProject.workspaceRoot}
            onCommit={(next) => void commit(next)}
            normalizeDraft={resolvePastedPath}
            placeholder="~/"
            spellCheck={false}
            aria-label={gt("Chats folder")}
          />
        }
      />
    </SettingsSection>
  );
}
