"use strict";

/**
 * Shared extension constants
 *
 * This module centralizes ids, defaults, and validation rules that are used by
 * multiple runtime files. Keeping them here reduces drift between modules.
 */

/*
 * ============================================================================
 * Public ids
 * ============================================================================
 *
 * These values must stay aligned with package.json because users, settings, and
 * VS Code itself reference them by these exact strings.
 */

const CONFIG_SCOPE = "fileStarter";
const COMMAND_ID = "fileStarter.createFile";

/*
 * ============================================================================
 * Default configuration values
 * ============================================================================
 *
 * These defaults backstop the values contributed in package.json so the runtime
 * stays predictable even when a setting is missing or a helper is reused.
 */

const DEFAULT_TEMPLATE_DIRECTORY = ".vscode/templates";
const DEFAULT_TEMPLATE_PATTERN = "*.template.md";

/*
 * ============================================================================
 * Cross-platform file-name rules
 * ============================================================================
 *
 * The extension should behave consistently on Windows, macOS, and Linux. These
 * regular expressions enforce a conservative rule set that works everywhere.
 */

const INVALID_FILE_NAME_CHARACTERS = /[<>:"/\\|?*\u0000-\u001F]/;
const WINDOWS_RESERVED_FILE_NAMES = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$/i;
const MAX_FILE_NAME_LENGTH = 255;

module.exports = {
  COMMAND_ID,
  CONFIG_SCOPE,
  DEFAULT_TEMPLATE_DIRECTORY,
  DEFAULT_TEMPLATE_PATTERN,
  INVALID_FILE_NAME_CHARACTERS,
  MAX_FILE_NAME_LENGTH,
  WINDOWS_RESERVED_FILE_NAMES
};
