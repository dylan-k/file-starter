"use strict";

/**
 * Template rendering helpers
 *
 * This module turns the template text into a completed file by preparing
 * built-in variables, honoring user configuration, and replacing placeholders.
 */
const path = require("path");

const { escapeRegExp } = require("./strings");

/*
 * ============================================================================
 * Variable preparation
 * ============================================================================
 *
 * These helpers decide which placeholder syntaxes are enabled and which values
 * are exposed to the template at render time.
 */

// Keep only the supported syntax names and fall back to all of them if the
// configuration is missing or invalid.
function normalizeVariableSyntaxes(raw) {
  const defaults = ["doubleCurly", "dollarCurly", "singleCurly"];
  if (!Array.isArray(raw) || raw.length === 0) {
    return defaults;
  }

  const filtered = raw.filter((item) => defaults.includes(item));
  return filtered.length > 0 ? filtered : defaults;
}

/**
 * Build the dictionary of values available inside a template.
 *
 * Example:
 * - title -> the title entered by the user
 * - date -> today's date in local YYYY-MM-DD form
 * - filename -> the output file name without extension
 */
function buildVariables({ title, fileName, templateName, config }) {
  const now = new Date();
  const localDate = formatLocalDate(now);
  const dateParts = localDate.split("-");

  const outputExtension = path.extname(fileName);
  const outputBaseName = path.basename(fileName, outputExtension);
  const customVariables = config.get("customVariables", {});

  const builtIns = {
    title,
    name: title,
    date: localDate,
    datetime: formatLocalDateTime(now),
    year: dateParts[0],
    month: dateParts[1],
    day: dateParts[2],
    file: fileName,
    filename: outputBaseName,
    extension: outputExtension.replace(/^\./, ""),
    template: templateName
  };

  // Custom variables are merged into the variable dictionary. If a custom key
  // collides with a built-in name, prefix it with "custom_" so the built-in
  // value is never silently shadowed.
  for (const [key, value] of Object.entries(customVariables)) {
    const safeKey = key in builtIns ? `custom_${key}` : key;
    builtIns[safeKey] = String(value);
  }

  return builtIns;
}

/*
 * ============================================================================
 * Placeholder replacement
 * ============================================================================
 *
 * These helpers do the actual text replacement inside the template content.
 */

/**
 * Replace every supported variable syntax in the template content.
 *
 * For example, if "title" is "Weekly Plan", then any enabled occurrence of
 * "{{title}}", "${title}", or "{title}" will be replaced with "Weekly Plan".
 */
function renderTemplate(content, variables, syntaxes) {
  let result = content;
  const orderedSyntaxes = ["doubleCurly", "dollarCurly", "singleCurly"].filter((name) =>
    syntaxes.includes(name)
  );

  for (const [key, value] of Object.entries(variables)) {
    const escapedName = escapeRegExp(key);

    for (const syntax of orderedSyntaxes) {
      const pattern = variablePatternForSyntax(syntax, escapedName);
      if (!pattern) {
        continue;
      }

      result = result.replace(pattern, String(value));
    }
  }

  return result;
}

// Build the regular expression used to match one variable name in one syntax.
function variablePatternForSyntax(syntax, escapedName) {
  if (syntax === "doubleCurly") {
    return new RegExp(`\\{\\{\\s*${escapedName}\\s*\\}\\}`, "gi");
  }
  if (syntax === "dollarCurly") {
    return new RegExp(`\\$\\{\\s*${escapedName}\\s*\\}`, "gi");
  }
  if (syntax === "singleCurly") {
    // Negative lookbehind prevents matching inside ${…} (dollarCurly syntax).
    return new RegExp(`(?<!\\$)\\{\\s*${escapedName}\\s*\\}`, "gi");
  }
  return null;
}

/*
 * ============================================================================
 * Local date formatting
 * ============================================================================
 *
 * These helpers avoid UTC drift by formatting date values in the user's local
 * time zone.
 */

// Format dates using the local time zone so date variables match the user's day.
function formatLocalDate(date) {
  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`;
}

// Produce an ISO 8601 timestamp that includes the local timezone offset.
function formatLocalDateTime(date) {
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absoluteOffset = Math.abs(offsetMinutes);
  const offsetHours = Math.floor(absoluteOffset / 60);
  const offsetRemainderMinutes = absoluteOffset % 60;

  return (
    `${formatLocalDate(date)}T${padNumber(date.getHours())}:${padNumber(date.getMinutes())}` +
    `:${padNumber(date.getSeconds())}${sign}${padNumber(offsetHours)}:${padNumber(offsetRemainderMinutes)}`
  );
}

function padNumber(value) {
  return String(value).padStart(2, "0");
}

module.exports = {
  buildVariables,
  normalizeVariableSyntaxes,
  renderTemplate
};
