import * as NodeOS from "node:os";

export const G3_CHATS_PROJECT_TITLE = "Chats";

/** True when G3_CHATS_DIR pins the chats folder, overriding the one chosen in Settings. */
export const hasExplicitChatsRoot = (env: NodeJS.ProcessEnv = process.env): boolean =>
  (env.G3_CHATS_DIR?.trim() ?? "") !== "";

export const resolveChatsRoot = (env: NodeJS.ProcessEnv = process.env): string =>
  env.G3_CHATS_DIR?.trim() || NodeOS.homedir();
