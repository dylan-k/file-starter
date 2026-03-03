"use strict";

// Patch Module._resolveFilename so require("vscode") resolves to our mock.
require("./helpers/mockVscode");

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  displayTemplateName,
  determineOutputExtension,
} = require("../services/templateDiscovery");

// ---------------------------------------------------------------------------
// displayTemplateName
// ---------------------------------------------------------------------------

describe("displayTemplateName", () => {
  it('returns "note" for "note.template.md"', () => {
    assert.equal(displayTemplateName("note.template.md"), "note");
  });

  it('returns "daily-note" for "daily-note.template.md"', () => {
    assert.equal(displayTemplateName("daily-note.template.md"), "daily-note");
  });

  it('returns "plain" for "plain.template"', () => {
    assert.equal(displayTemplateName("plain.template"), "plain");
  });

  it('returns "notemplate" for "notemplate.md" (no .template segment)', () => {
    assert.equal(displayTemplateName("notemplate.md"), "notemplate");
  });

  it('returns "my.notes" for "my.notes.template.txt"', () => {
    assert.equal(displayTemplateName("my.notes.template.txt"), "my.notes");
  });

  it("handles uppercase TEMPLATE segment", () => {
    assert.equal(displayTemplateName("note.TEMPLATE.md"), "note");
  });
});

// ---------------------------------------------------------------------------
// determineOutputExtension
// ---------------------------------------------------------------------------

describe("determineOutputExtension", () => {
  it('returns ".md" for "note.template.md"', () => {
    assert.equal(determineOutputExtension("note.template.md"), ".md");
  });

  it('returns ".sh" for "script.template.sh"', () => {
    assert.equal(determineOutputExtension("script.template.sh"), ".sh");
  });

  it('returns "" for "bare.template"', () => {
    assert.equal(determineOutputExtension("bare.template"), "");
  });

  it('returns ".txt" for "readme.template.txt"', () => {
    assert.equal(determineOutputExtension("readme.template.txt"), ".txt");
  });

  it('returns ".json" for "config.template.json"', () => {
    assert.equal(determineOutputExtension("config.template.json"), ".json");
  });
});
