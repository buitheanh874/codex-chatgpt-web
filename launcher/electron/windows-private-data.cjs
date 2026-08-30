const fs = require("node:fs");
const path = require("node:path");
const childProcess = require("node:child_process");

const CODEX_SANDBOX_GROUP = "CodexSandboxUsers";

function commandOutput(result) {
  return `${result.stdout || ""}\n${result.stderr || ""}`;
}

function auditAcl(directory, spawnSync) {
  const result = spawnSync("icacls.exe", [directory], {
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.error || result.status !== 0) {
    const failure = result.error?.message || `exit ${result.status}`;
    throw new Error(`Could not inspect the launcher browser-profile ACL (${failure})`);
  }
  return commandOutput(result);
}

function sandboxGroupMentioned(output) {
  return new RegExp(`${CODEX_SANDBOX_GROUP}:`, "i").test(output);
}

function sandboxReadDenied(output) {
  return new RegExp(`${CODEX_SANDBOX_GROUP}:[^\\r\\n]*\\(DENY\\)[^\\r\\n]*\\(RX\\)`, "i").test(output);
}

/**
 * The native Codex Windows sandbox grants its worker group read access to parts of the user
 * profile. The launcher browser profile contains authenticated ChatGPT state, so add a narrow,
 * inheritable deny only when that group is present in the effective ACL.
 */
function hardenWindowsPrivateDirectory(
  directory,
  { platform = process.platform, lstatSync = fs.lstatSync, spawnSync = childProcess.spawnSync } = {},
) {
  if (platform !== "win32") return { changed: false, protected: true, reason: "not-windows" };
  const resolved = path.resolve(directory);
  const stat = lstatSync(resolved);
  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    throw new Error(`Refusing unsafe launcher private-data ACL target: ${resolved}`);
  }

  const before = auditAcl(resolved, spawnSync);
  if (sandboxReadDenied(before)) {
    return { changed: false, protected: true, reason: "already-protected" };
  }
  if (!sandboxGroupMentioned(before)) {
    return { changed: false, protected: true, reason: "sandbox-group-has-no-access" };
  }

  const applied = spawnSync(
    "icacls.exe",
    [resolved, "/deny", `${CODEX_SANDBOX_GROUP}:(OI)(CI)(RX)`],
    { encoding: "utf8", windowsHide: true },
  );
  if (applied.error || applied.status !== 0) {
    const failure = applied.error?.message || `exit ${applied.status}`;
    throw new Error(`Could not protect the launcher browser profile (${failure})`);
  }
  if (!sandboxReadDenied(auditAcl(resolved, spawnSync))) {
    throw new Error("Launcher browser-profile ACL verification failed");
  }
  return { changed: true, protected: true, reason: "deny-added" };
}

module.exports = {
  CODEX_SANDBOX_GROUP,
  hardenWindowsPrivateDirectory,
  sandboxGroupMentioned,
  sandboxReadDenied,
};
