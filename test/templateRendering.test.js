"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  normalizeVariableSyntaxes,
  buildVariables,
  renderTemplate,
} = require("../services/templateRendering");

// ---------------------------------------------------------------------------
// normalizeVariableSyntaxes
// ---------------------------------------------------------------------------

describe("normalizeVariableSyntaxes", () => {
  const defaults = ["doubleCurly", "dollarCurly", "singleCurly"];

  it("returns a valid array as-is (filtered to known names)", () => {
    const input = ["doubleCurly", "singleCurly"];
    assert.deepEqual(normalizeVariableSyntaxes(input), input);
  });

  it("returns all three defaults for undefined", () => {
    assert.deepEqual(normalizeVariableSyntaxes(undefined), defaults);
  });

  it("returns all three defaults for null", () => {
    assert.deepEqual(normalizeVariableSyntaxes(null), defaults);
  });

  it("returns all three defaults for empty array", () => {
    assert.deepEqual(normalizeVariableSyntaxes([]), defaults);
  });

  it("returns all three defaults for non-array (string)", () => {
    assert.deepEqual(normalizeVariableSyntaxes("doubleCurly"), defaults);
  });

  it("returns all three defaults for non-array (number)", () => {
    assert.deepEqual(normalizeVariableSyntaxes(42), defaults);
  });

  it("filters out unknown syntax names", () => {
    assert.deepEqual(
      normalizeVariableSyntaxes(["doubleCurly", "tripleCurly"]),
      ["doubleCurly"]
    );
  });

  it("falls back to defaults when all names are unknown", () => {
    assert.deepEqual(
      normalizeVariableSyntaxes(["tripleCurly", "backtick"]),
      defaults
    );
  });
});

// ---------------------------------------------------------------------------
// buildVariables
// ---------------------------------------------------------------------------

describe("buildVariables", () => {
  function makeConfig(customVars) {
    return {
      get: (key, defaultValue) =>
        key === "customVariables" ? customVars : defaultValue,
    };
  }

  it("contains title, name, date, datetime, year, month, day, file, filename, extension, template", () => {
    const vars = buildVariables({
      title: "My Note",
      fileName: "my-note.md",
      templateName: "note",
      config: makeConfig({}),
    });

    assert.equal(vars.title, "My Note");
    assert.equal(vars.name, "My Note");
    assert.equal(vars.file, "my-note.md");
    assert.equal(vars.filename, "my-note");
    assert.equal(vars.extension, "md");
    assert.equal(vars.template, "note");

    // Date fields exist and are non-empty
    assert.ok(vars.date);
    assert.ok(vars.datetime);
    assert.ok(vars.year);
    assert.ok(vars.month);
    assert.ok(vars.day);

    // Date format: YYYY-MM-DD
    assert.match(vars.date, /^\d{4}-\d{2}-\d{2}$/);
    // Year is 4 digits
    assert.match(vars.year, /^\d{4}$/);
    // Month and day are 2 digits
    assert.match(vars.month, /^\d{2}$/);
    assert.match(vars.day, /^\d{2}$/);
  });

  it("merges custom variables into the result", () => {
    const vars = buildVariables({
      title: "Test",
      fileName: "test.txt",
      templateName: "basic",
      config: makeConfig({ author: "Alice", project: "Demo" }),
    });

    assert.equal(vars.author, "Alice");
    assert.equal(vars.project, "Demo");
  });

  it("prefixes custom variable that collides with a built-in key", () => {
    const vars = buildVariables({
      title: "Test",
      fileName: "test.txt",
      templateName: "basic",
      config: makeConfig({ date: "oops" }),
    });

    // Built-in date is untouched
    assert.match(vars.date, /^\d{4}-\d{2}-\d{2}$/);
    // Custom var lands under custom_date
    assert.equal(vars.custom_date, "oops");
  });

  it("converts custom variable values to strings", () => {
    const vars = buildVariables({
      title: "Test",
      fileName: "test.txt",
      templateName: "basic",
      config: makeConfig({ count: 42, active: true }),
    });

    assert.equal(vars.count, "42");
    assert.equal(vars.active, "true");
  });

  it("handles file with no extension", () => {
    const vars = buildVariables({
      title: "Makefile",
      fileName: "Makefile",
      templateName: "makefile",
      config: makeConfig({}),
    });

    assert.equal(vars.file, "Makefile");
    assert.equal(vars.filename, "Makefile");
    assert.equal(vars.extension, "");
  });
});

// ---------------------------------------------------------------------------
// renderTemplate
// ---------------------------------------------------------------------------

describe("renderTemplate", () => {
  const allSyntaxes = ["doubleCurly", "dollarCurly", "singleCurly"];

  it("replaces {{title}} with doubleCurly syntax", () => {
    const result = renderTemplate(
      "Hello {{title}}!",
      { title: "World" },
      allSyntaxes
    );
    assert.equal(result, "Hello World!");
  });

  it("replaces ${title} with dollarCurly syntax", () => {
    const result = renderTemplate(
      "Hello ${title}!",
      { title: "World" },
      allSyntaxes
    );
    assert.equal(result, "Hello World!");
  });

  it("replaces {title} with singleCurly syntax", () => {
    const result = renderTemplate(
      "Hello {title}!",
      { title: "World" },
      allSyntaxes
    );
    assert.equal(result, "Hello World!");
  });

  it("tolerates whitespace inside {{ title }}", () => {
    const result = renderTemplate(
      "Hello {{ title }}!",
      { title: "World" },
      allSyntaxes
    );
    assert.equal(result, "Hello World!");
  });

  it("tolerates whitespace inside ${ title }", () => {
    const result = renderTemplate(
      "Hello ${ title }!",
      { title: "World" },
      allSyntaxes
    );
    assert.equal(result, "Hello World!");
  });

  it("tolerates whitespace inside { title }", () => {
    const result = renderTemplate(
      "Hello { title }!",
      { title: "World" },
      allSyntaxes
    );
    assert.equal(result, "Hello World!");
  });

  it("singleCurly does NOT match inside ${title}", () => {
    // Only singleCurly is enabled — ${title} should stay untouched
    const result = renderTemplate(
      "Hello ${title}!",
      { title: "World" },
      ["singleCurly"]
    );
    assert.equal(result, "Hello ${title}!");
  });

  it("processes only enabled syntaxes (doubleCurly only)", () => {
    const result = renderTemplate(
      "A: {{title}}, B: ${title}, C: {title}",
      { title: "X" },
      ["doubleCurly"]
    );
    assert.equal(result, "A: X, B: ${title}, C: {title}");
  });

  it("processes only enabled syntaxes (dollarCurly only)", () => {
    const result = renderTemplate(
      "A: {{title}}, B: ${title}, C: {title}",
      { title: "X" },
      ["dollarCurly"]
    );
    assert.equal(result, "A: {{title}}, B: X, C: {title}");
  });

  it("replaces multiple variables in the same content", () => {
    const result = renderTemplate(
      "Title: {{title}}, Author: {{author}}",
      { title: "Plan", author: "Alice" },
      allSyntaxes
    );
    assert.equal(result, "Title: Plan, Author: Alice");
  });

  it("leaves unknown variables as-is", () => {
    const result = renderTemplate(
      "Hello {{unknown}}!",
      { title: "World" },
      allSyntaxes
    );
    assert.equal(result, "Hello {{unknown}}!");
  });

  it("replaces the same variable appearing multiple times", () => {
    const result = renderTemplate(
      "{{title}} and {{title}} again",
      { title: "Hi" },
      allSyntaxes
    );
    assert.equal(result, "Hi and Hi again");
  });

  it("replacement is case-insensitive for variable names", () => {
    const result = renderTemplate(
      "{{TITLE}} and {{Title}}",
      { title: "Hi" },
      allSyntaxes
    );
    assert.equal(result, "Hi and Hi");
  });

  it("handles empty content", () => {
    const result = renderTemplate("", { title: "X" }, allSyntaxes);
    assert.equal(result, "");
  });

  it("handles empty variables object", () => {
    const result = renderTemplate("{{title}}", {}, allSyntaxes);
    assert.equal(result, "{{title}}");
  });
});
