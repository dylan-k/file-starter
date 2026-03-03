"use strict";

/**
 * Template discovery helpers
 *
 * This module is responsible for finding template files, matching them against
 * the configured glob pattern, and exposing small helpers derived from template
 * file names.
 */
const path = require("path");
const vscode = require("vscode");

const { DEFAULT_TEMPLATE_PATTERN } = require("../constants");
const { toPosix } = require("./pathing");
const { escapeRegExp } = require("./strings");

/*
 * ============================================================================
 * Template collection
 * ============================================================================
 *
 * The command module asks for templates at a high level. This module performs
 * the recursive scan and the filtering details.
 */

/**
 * Find every file under the template directory, then filter them with the
 * configured glob pattern.
 *
 * If the pattern contains "/", we match against the path relative to the
 * template directory. Otherwise we match only against the file's base name.
 */
async function findTemplateFiles(templateDirectoryUri, templatePattern) {
  const files = [];
  await collectFiles(templateDirectoryUri, files);

  const normalizedPattern = toPosix((templatePattern || DEFAULT_TEMPLATE_PATTERN).trim() || DEFAULT_TEMPLATE_PATTERN);
  const matcher = globToRegExp(normalizedPattern);
  const patternTargetsPath = normalizedPattern.includes("/");

  return files
    .map((uri) => {
      const relativePath = toPosix(path.relative(templateDirectoryUri.fsPath, uri.fsPath));
      const fileName = path.basename(uri.fsPath);
      const candidate = patternTargetsPath ? relativePath : fileName;
      if (!matcher.test(candidate)) {
        return null;
      }

      return {
        uri,
        fileName,
        relativePath,
        displayLabel: displayTemplateName(fileName)
      };
    })
    .filter((value) => Boolean(value))
    .sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

// Recursively walk through the template directory tree and collect file uris.
async function collectFiles(currentDirectoryUri, files) {
  const entries = await vscode.workspace.fs.readDirectory(currentDirectoryUri);
  for (const [name, type] of entries) {
    const nextUri = vscode.Uri.joinPath(currentDirectoryUri, name);

    if ((type & vscode.FileType.Directory) === vscode.FileType.Directory) {
      await collectFiles(nextUri, files);
      continue;
    }

    if ((type & vscode.FileType.File) === vscode.FileType.File) {
      files.push(nextUri);
    }
  }
}

/*
 * ============================================================================
 * Template-name helpers
 * ============================================================================
 *
 * These helpers turn file names like `note.template.md` into the values the UI
 * and output-file logic need.
 */

// Turn "daily-note.template.md" into a shorter label like "daily-note".
function displayTemplateName(fileName) {
  let name = fileName.replace(/\.template(?=\.)/i, "").replace(/\.template$/i, "");
  const extension = path.extname(name);
  if (extension) {
    name = name.slice(0, -extension.length);
  }
  return name;
}

// Preserve the final output extension so "note.template.md" becomes ".md".
function determineOutputExtension(fileName) {
  const withoutTemplate = fileName.replace(/\.template(?=\.)/i, "").replace(/\.template$/i, "");
  return path.extname(withoutTemplate);
}

/*
 * ============================================================================
 * Pattern matching
 * ============================================================================
 *
 * The extension supports a small glob syntax for discovering template files.
 */

/**
 * Convert a simplified glob pattern into a regular expression.
 *
 * Supported tokens:
 * - *  matches any characters except "/"
 * - ?  matches one character except "/"
 * - ** matches across folder boundaries
 */
function globToRegExp(globPattern) {
  const placeholder = "__DOUBLE_STAR__";
  const escaped = escapeRegExp(globPattern)
    .replace(/\\\*\\\*/g, placeholder)
    .replace(/\\\*/g, "[^/]*")
    .replace(/\\\?/g, "[^/]")
    .replace(new RegExp(placeholder, "g"), ".*");

  return new RegExp(`^${escaped}$`, "i");
}

module.exports = {
  determineOutputExtension,
  displayTemplateName,
  findTemplateFiles
};
