"use strict";

/**
 * File-name validation helpers
 *
 * This module keeps file-name suggestion and validation rules in one place so
 * the command flow stays focused on user interaction rather than string rules.
 */
const {
  INVALID_FILE_NAME_CHARACTERS,
  MAX_FILE_NAME_LENGTH,
  WINDOWS_RESERVED_FILE_NAMES
} = require("../constants");

/*
 * ============================================================================
 * Suggested file names
 * ============================================================================
 *
 * The title can contain characters that do not belong in a file name. This
 * helper produces a safer default before the user sees the file-name prompt.
 */

// Create a file-name suggestion that is valid across Windows, macOS, and Linux.
function buildSuggestedFileName(title, outputExtension) {
  let baseName = String(title || "").trim();
  if (!baseName) {
    baseName = "untitled";
  }

  baseName = baseName
    .replace(/[<>:"/\\|?*\u0000-\u001F]+/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/g, "");

  if (!baseName || baseName === "." || baseName === "..") {
    baseName = "untitled";
  }

  if (WINDOWS_RESERVED_FILE_NAMES.test(baseName)) {
    baseName = `${baseName}-file`;
  }

  return `${baseName}${outputExtension}`;
}

/*
 * ============================================================================
 * Cross-platform validation
 * ============================================================================
 *
 * These rules deliberately use the strictest common subset so a file name
 * accepted on one operating system will also work on the others.
 */

// Enforce a conservative cross-platform file-name rule set for user input.
function validateFileName(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) {
    return "File name is required.";
  }
  if (trimmed === "." || trimmed === "..") {
    return "Use a regular file name.";
  }
  if (/[\\/]/.test(trimmed)) {
    return "Use file name only, without path separators.";
  }
  if (INVALID_FILE_NAME_CHARACTERS.test(trimmed)) {
    return "Use a file name that is valid on Windows, macOS, and Linux.";
  }
  if (/[. ]$/.test(trimmed)) {
    return "File name cannot end with a space or period.";
  }
  if (WINDOWS_RESERVED_FILE_NAMES.test(trimmed)) {
    return "File name uses a Windows reserved name.";
  }
  if (trimmed.length > MAX_FILE_NAME_LENGTH) {
    return `File name must be ${MAX_FILE_NAME_LENGTH} characters or fewer.`;
  }

  return null;
}

module.exports = {
  buildSuggestedFileName,
  validateFileName
};
