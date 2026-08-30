const test = require("node:test");
const assert = require("node:assert/strict");
const {
  hardenWindowsPrivateDirectory,
  sandboxGroupMentioned,
  sandboxReadDenied,
} = require("../electron/windows-private-data.cjs");

const privatePath = "C:\\private";
const allowAcl = `${privatePath} BTA\\CodexSandboxUsers:(I)(OI)(CI)(RX)`;
const denyAcl = `${privatePath} BTA\\CodexSandboxUsers:(OI)(CI)(DENY)(RX)`;

test("Windows private-data ACL detection distinguishes inherited access and explicit denial", () => {
  assert.equal(sandboxGroupMentioned(allowAcl), true);
  assert.equal(sandboxReadDenied(allowAcl), false);
  assert.equal(sandboxReadDenied(denyAcl), true);
});

test("Windows private-data hardening adds and verifies one narrow deny", () => {
  const calls = [];
  const results = [
    { status: 0, stdout: allowAcl, stderr: "" },
    { status: 0, stdout: "processed", stderr: "" },
    { status: 0, stdout: `${denyAcl}\n${allowAcl}`, stderr: "" },
  ];
  const result = hardenWindowsPrivateDirectory(privatePath, {
    platform: "win32",
    lstatSync: () => ({ isDirectory: () => true, isSymbolicLink: () => false }),
    spawnSync: (command, args) => {
      calls.push([command, args]);
      return results.shift();
    },
  });
  assert.deepEqual(result, { changed: true, protected: true, reason: "deny-added" });
  assert.deepEqual(calls[1], [
    "icacls.exe",
    [privatePath, "/deny", "CodexSandboxUsers:(OI)(CI)(RX)"],
  ]);
});

test("Windows private-data hardening is idempotent", () => {
  let calls = 0;
  const result = hardenWindowsPrivateDirectory(privatePath, {
    platform: "win32",
    lstatSync: () => ({ isDirectory: () => true, isSymbolicLink: () => false }),
    spawnSync: () => {
      calls += 1;
      return { status: 0, stdout: denyAcl, stderr: "" };
    },
  });
  assert.equal(calls, 1);
  assert.deepEqual(result, { changed: false, protected: true, reason: "already-protected" });
});

test("Windows private-data hardening refuses reparse points", () => {
  assert.throws(() => hardenWindowsPrivateDirectory(privatePath, {
    platform: "win32",
    lstatSync: () => ({ isDirectory: () => true, isSymbolicLink: () => true }),
  }), /unsafe launcher private-data ACL target/);
});
