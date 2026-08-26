#!/usr/bin/env node
/**
 * Keep Dropbox out of the build directories.
 *
 * This project lives inside a Dropbox folder. Dropbox syncs .next while Next is
 * writing to it, produces "conflicted copy" files, and those files then break
 * `tsc` because they contain duplicate ambient type declarations.
 *
 * Two defences: delete any conflicted copies that exist, and re-apply the
 * com.dropbox.ignored attribute, which is lost whenever the directory is
 * recreated. Both are macOS-specific and both no-op harmlessly elsewhere, so
 * CI on Linux is unaffected.
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const DIRS = [".next", "out", "node_modules"];

function removeConflicted(dir) {
  if (!existsSync(dir)) return 0;
  let removed = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.name.includes("conflicted copy")) {
      rmSync(path, { recursive: true, force: true });
      removed += 1;
    } else if (entry.isDirectory()) {
      removed += removeConflicted(path);
    }
  }
  return removed;
}

let removed = 0;
for (const dir of DIRS) removed += removeConflicted(dir);
if (removed > 0) console.log(`Removed ${removed} Dropbox conflicted copies.`);

if (process.platform === "darwin") {
  for (const dir of DIRS) {
    try {
      mkdirSync(dir, { recursive: true });
      execFileSync("xattr", ["-w", "com.dropbox.ignored", "1", dir], {
        stdio: "ignore",
      });
    } catch {
      // Not on Dropbox, or xattr unavailable. Nothing to do.
    }
  }
}
