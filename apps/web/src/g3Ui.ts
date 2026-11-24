/**
 * G3 runs every chat in one folder, so project, git, worktree and pull request controls are hidden
 * everywhere except inside a thread, where they still describe what that thread did.
 */
export const G3_HIDE_PROJECT_UI: boolean = true;

/** Keybindings for project, branch, worktree and pull request actions, which G3 does not surface. */
export const G3_HIDDEN_KEYBINDING_COMMANDS: ReadonlySet<string> = new Set([
  "thread.copyReference",
  "pullRequest.copyNumber",
  "projectSearch.toggle",
  "composer.workspace",
  "composer.previousWorktree",
  "composer.branch",
  "chat.newLocal",
  "chat.newWithoutProject",
]);

/** Settings pages G3 leaves out of the settings sidebar and search. */
export const G3_HIDDEN_SETTINGS_PATHS: ReadonlySet<string> = new Set([
  "/settings/diffs",
  "/settings/projects",
  "/settings/source-control",
  "/settings/worktrees",
]);

/** Settings rows G3 hides, by their search target id. */
export const G3_HIDDEN_SETTINGS_IDS: ReadonlySet<string> = new Set([
  "project-grouping",
  "project-order",
  "add-project-starts-in",
  "ghq-clone-layout",
  "new-threads",
  "auto-settle-merged-threads",
  "boring-sidebar",
  "boring-sidebar-multiline",
  "worktree-fast-checkout",
]);
