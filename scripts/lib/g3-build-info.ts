// @effect-diagnostics nodeBuiltinImport:off - Vite config reads git before any Effect runtime exists.
import * as NodeChildProcess from "node:child_process";

/** G3 tracks upstream T3 Code; the build records its checkout and the upstream commit it merged. */
export function readG3BuildInfo(cwd: string = import.meta.dirname): {
  readonly upstreamBase: string;
  readonly sourceDir: string;
} {
  const git = (...args: ReadonlyArray<string>) => {
    try {
      return NodeChildProcess.execFileSync("git", args, {
        cwd,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
    } catch {
      return "";
    }
  };
  return {
    upstreamBase: git("merge-base", "HEAD", "upstream/main"),
    sourceDir: git("rev-parse", "--show-toplevel"),
  };
}
