import * as NodeOS from "node:os";

export const G3_CHATS_PROJECT_TITLE = "Chats";

export const resolveChatsRoot = (env: NodeJS.ProcessEnv = process.env): string =>
  env.G3_CHATS_DIR?.trim() || NodeOS.homedir();
