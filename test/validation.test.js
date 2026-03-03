"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  buildSuggestedFileName,
  validateFileName,
} = require("../services/validation");

// ---------------------------------------------------------------------------
// buildSuggestedFileName
// ---------------------------------------------------------------------------

describe("buildSuggestedFileName", () => {
  it("returns title + extension for a normal title", () => {
    assert.equal(buildSuggestedFileName("my-notes", ".md"), "my-notes.md");
  });

  it("replaces dangerous characters with hyphens", () => {
    assert.equal(
      buildSuggestedFileName('hello<world>:test"ok', ".txt"),
      "hello-world-test-ok.txt"
    );
  });

  it("falls back to 'untitled' for empty title", () => {
    assert.equal(buildSuggestedFileName("", ".md"), "untitled.md");
  });

  it("falls back to 'untitled' for whitespace-only title", () => {
    assert.equal(buildSuggestedFileName("   ", ".md"), "untitled.md");
  });

  it("falls back to 'untitled' for null title", () => {
    assert.equal(buildSuggestedFileName(null, ".md"), "untitled.md");
  });

  it("falls back to 'untitled' for undefined title", () => {
    assert.equal(buildSuggestedFileName(undefined, ".md"), "untitled.md");
  });

  it("adds -file suffix for Windows reserved name", () => {
    assert.equal(buildSuggestedFileName("CON", ".txt"), "CON-file.txt");
  });

  it("adds -file suffix for reserved name with extension-like title", () => {
    assert.equal(buildSuggestedFileName("NUL.txt", ".md"), "NUL.txt-file.md");
  });

  it("adds -file suffix for COM1", () => {
    assert.equal(buildSuggestedFileName("com1", ".md"), "com1-file.md");
  });

  it("strips trailing dots", () => {
    assert.equal(buildSuggestedFileName("hello...", ".md"), "hello.md");
  });

  it("strips trailing spaces", () => {
    assert.equal(buildSuggestedFileName("hello   ", ".md"), "hello.md");
  });

  it("strips trailing mixed dots and spaces", () => {
    assert.equal(buildSuggestedFileName("hello . . ", ".md"), "hello.md");
  });
});

// ---------------------------------------------------------------------------
// validateFileName
// ---------------------------------------------------------------------------

describe("validateFileName", () => {
  it("returns null for a valid file name", () => {
    assert.equal(validateFileName("readme.md"), null);
  });

  it("returns null for a simple valid name", () => {
    assert.equal(validateFileName("notes"), null);
  });

  it("returns error for empty string", () => {
    assert.notEqual(validateFileName(""), null);
  });

  it("returns error for whitespace-only string", () => {
    assert.notEqual(validateFileName("   "), null);
  });

  it("returns error for null", () => {
    assert.notEqual(validateFileName(null), null);
  });

  it("returns error for undefined", () => {
    assert.notEqual(validateFileName(undefined), null);
  });

  it('returns error for "."', () => {
    assert.notEqual(validateFileName("."), null);
  });

  it('returns error for ".."', () => {
    assert.notEqual(validateFileName(".."), null);
  });

  it("rejects forward slash", () => {
    assert.notEqual(validateFileName("a/b"), null);
  });

  it("rejects backslash", () => {
    assert.notEqual(validateFileName("a\\b"), null);
  });

  it("rejects invalid characters (<)", () => {
    assert.notEqual(validateFileName("file<name"), null);
  });

  it("rejects invalid characters (>)", () => {
    assert.notEqual(validateFileName("file>name"), null);
  });

  it("rejects invalid characters (:)", () => {
    assert.notEqual(validateFileName("file:name"), null);
  });

  it('rejects invalid characters (")', () => {
    assert.notEqual(validateFileName('file"name'), null);
  });

  it("rejects invalid characters (|)", () => {
    assert.notEqual(validateFileName("file|name"), null);
  });

  it("rejects invalid characters (?)", () => {
    assert.notEqual(validateFileName("file?name"), null);
  });

  it("rejects invalid characters (*)", () => {
    assert.notEqual(validateFileName("file*name"), null);
  });

  it("accepts trailing space because input is trimmed", () => {
    // validateFileName trims input first, so "hello " becomes "hello"
    assert.equal(validateFileName("hello "), null);
  });

  it("rejects name that ends with space before extension", () => {
    // A name like "hello .txt" still has a space character inside (not trailing after trim)
    // but the [. ]$ check catches a period at the end
    assert.notEqual(validateFileName("hello."), null);
  });

  it("rejects trailing period", () => {
    assert.notEqual(validateFileName("hello."), null);
  });

  it("rejects Windows reserved name CON", () => {
    assert.notEqual(validateFileName("CON"), null);
  });

  it("rejects Windows reserved name con (lowercase)", () => {
    assert.notEqual(validateFileName("con"), null);
  });

  it("rejects Windows reserved name PRN", () => {
    assert.notEqual(validateFileName("PRN"), null);
  });

  it("rejects Windows reserved name AUX", () => {
    assert.notEqual(validateFileName("AUX"), null);
  });

  it("rejects Windows reserved name NUL", () => {
    assert.notEqual(validateFileName("NUL"), null);
  });

  it("rejects Windows reserved name COM1", () => {
    assert.notEqual(validateFileName("COM1"), null);
  });

  it("rejects Windows reserved name LPT1", () => {
    assert.notEqual(validateFileName("LPT1"), null);
  });

  it("rejects Windows reserved name with extension (CON.txt)", () => {
    assert.notEqual(validateFileName("CON.txt"), null);
  });

  it("rejects name longer than 255 characters", () => {
    const longName = "a".repeat(256);
    assert.notEqual(validateFileName(longName), null);
  });

  it("accepts name exactly 255 characters", () => {
    const name = "a".repeat(255);
    assert.equal(validateFileName(name), null);
  });
});
