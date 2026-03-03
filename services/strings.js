"use strict";

/**
 * String utilities
 *
 * @module strings
 *
 * Shared helpers for safe string manipulation used across the extension.
 */

// Escape special characters before inserting a string into a regular expression.
function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = {
  escapeRegExp
};
