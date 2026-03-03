"use strict";

// Patch Module._resolveFilename so require("vscode") resolves to our mock.
require("./helpers/mockVscode");

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  toPosix,
  isWithinRoot,
  toWorkspaceRelativePath,
} = require("../services/pathing");

// ---------------------------------------------------------------------------
// toPosix
// ---------------------------------------------------------------------------

describe("toPosix", () => {
  it("converts backslashes to forward slashes", () => {
    assert.equal(toPosix("a\\b\\c"), "a/b/c");
  });

  it("leaves forward slashes unchanged", () => {
    assert.equal(toPosix("a/b/c"), "a/b/c");
  });

  it("returns empty string for empty input", () => {
    assert.equal(toPosix(""), "");
  });

  it("returns empty string for null", () => {
    assert.equal(toPosix(null), "");
  });

  it("returns empty string for undefined", () => {
    assert.equal(toPosix(undefined), "");
  });

  it("handles mixed separators", () => {
    assert.equal(toPosix("a\\b/c\\d"), "a/b/c/d");
  });

  it("handles Windows absolute path", () => {
    assert.equal(toPosix("C:\\Users\\test\\file.txt"), "C:/Users/test/file.txt");
  });
});

// ---------------------------------------------------------------------------
// isWithinRoot
// ---------------------------------------------------------------------------

describe("isWithinRoot", () => {
  it("returns true for a child path", () => {
    assert.equal(isWithinRoot("/root/sub/file.txt", "/root"), true);
  });

  it("returns true when candidate equals root", () => {
    assert.equal(isWithinRoot("/root", "/root"), true);
  });

  it("returns false when candidate escapes above root", () => {
    assert.equal(isWithinRoot("/root/../outside", "/root"), false);
  });

  it("returns false for a sibling directory", () => {
    assert.equal(isWithinRoot("/other/file.txt", "/root"), false);
  });

  it("returns true for deeply nested child", () => {
    assert.equal(isWithinRoot("/root/a/b/c/d", "/root"), true);
  });
});

// ---------------------------------------------------------------------------
// toWorkspaceRelativePath
// ---------------------------------------------------------------------------

describe("toWorkspaceRelativePath", () => {
  it("returns relative posix path for a subdirectory", () => {
    // Use platform-appropriate paths; the function calls path.relative internally
    const result = toWorkspaceRelativePath("/workspace/src/file.js", "/workspace");
    assert.equal(result, "src/file.js");
  });

  it('returns "." when absolute path equals workspace root', () => {
    const result = toWorkspaceRelativePath("/workspace", "/workspace");
    assert.equal(result, ".");
  });

  it("returns nested relative path", () => {
    const result = toWorkspaceRelativePath(
      "/workspace/a/b/c.txt",
      "/workspace"
    );
    assert.equal(result, "a/b/c.txt");
  });
});
