"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const { escapeRegExp } = require("../services/strings");

describe("escapeRegExp", () => {
  it("escapes dot", () => {
    assert.equal(escapeRegExp("a.b"), "a\\.b");
  });

  it("escapes asterisk", () => {
    assert.equal(escapeRegExp("a*b"), "a\\*b");
  });

  it("escapes plus", () => {
    assert.equal(escapeRegExp("a+b"), "a\\+b");
  });

  it("escapes question mark", () => {
    assert.equal(escapeRegExp("a?b"), "a\\?b");
  });

  it("escapes caret", () => {
    assert.equal(escapeRegExp("a^b"), "a\\^b");
  });

  it("escapes dollar sign", () => {
    assert.equal(escapeRegExp("a$b"), "a\\$b");
  });

  it("escapes curly braces", () => {
    assert.equal(escapeRegExp("a{b}c"), "a\\{b\\}c");
  });

  it("escapes parentheses", () => {
    assert.equal(escapeRegExp("a(b)c"), "a\\(b\\)c");
  });

  it("escapes pipe", () => {
    assert.equal(escapeRegExp("a|b"), "a\\|b");
  });

  it("escapes square brackets", () => {
    assert.equal(escapeRegExp("a[b]c"), "a\\[b\\]c");
  });

  it("escapes backslash", () => {
    assert.equal(escapeRegExp("a\\b"), "a\\\\b");
  });

  it("returns normal string unchanged", () => {
    assert.equal(escapeRegExp("hello world"), "hello world");
  });

  it("escapes all special characters together", () => {
    const input = ".*+?^${}()|[]\\";
    const expected = "\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\";
    assert.equal(escapeRegExp(input), expected);
  });

  it("handles empty string", () => {
    assert.equal(escapeRegExp(""), "");
  });
});
