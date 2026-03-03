"use strict";

/**
 * Workspace and path helpers
 *
 * This module answers two recurring questions for the rest of the extension:
 * - Which workspace folder should we operate inside?
 * - How should a workspace-relative path be resolved and validated?
 */
const path = require("path");
const vscode = require("vscode");

/*
 * ============================================================================
 * Workspace resolution
 * ============================================================================
 *
 * The command can be launched from different parts of the UI, so these helpers
 * normalize that context into a single workspace folder and path model.
 */

/**
 * Pick the workspace folder that best matches the current command context.
 *
 * Preference order:
 * 1. The uri passed to the command.
 * 2. The file open in the active editor.
 * 3. The first workspace folder.
 */
function resolveWorkspaceFolder(targetUri) {
  if (targetUri) {
    const fromTarget = vscode.workspace.getWorkspaceFolder(targetUri);
    if (fromTarget) {
      return fromTarget;
    }
  }

  const fromEditorUri = vscode.window.activeTextEditor?.document?.uri;
  if (fromEditorUri) {
    const fromEditor = vscode.workspace.getWorkspaceFolder(fromEditorUri);
    if (fromEditor) {
      return fromEditor;
    }
  }

  return vscode.workspace.workspaceFolders?.[0];
}

/*
 * ============================================================================
 * Uri conversion and file-system inspection
 * ============================================================================
 *
 * These helpers convert configuration strings into vscode.Uri objects and read
 * file-system metadata without making callers deal with exceptions.
 */

/**
 * Convert a configured path into a vscode.Uri.
 *
 * Most settings are expected to be workspace-relative, but this helper also
 * accepts absolute paths to be tolerant of explicit user configuration.
 */
function resolveFolderUri(workspaceRootUri, configuredPath) {
  const raw = (configuredPath || "").trim();
  if (raw.length === 0) {
    return workspaceRootUri;
  }

  if (path.isAbsolute(raw)) {
    return vscode.Uri.file(path.normalize(raw));
  }

  const resolved = path.resolve(workspaceRootUri.fsPath, raw);
  return vscode.Uri.file(resolved);
}

// Read file metadata when the caller needs to distinguish a file from a folder.
async function tryStatUri(uri) {
  try {
    return await vscode.workspace.fs.stat(uri);
  } catch (error) {
    return null;
  }
}

// Treat "missing path" as false instead of forcing callers to catch errors.
async function uriExists(uri) {
  const stat = await tryStatUri(uri);
  return Boolean(stat);
}

/*
 * ============================================================================
 * Path normalization and safety
 * ============================================================================
 *
 * These helpers keep user-facing paths readable and prevent paths from
 * escaping above the current workspace root.
 */

// Use workspace-relative paths in messages because they are shorter to read.
function toWorkspaceRelativePath(absolutePath, workspaceRootPath) {
  const relative = toPosix(path.relative(workspaceRootPath, absolutePath));
  if (!relative || relative === "") {
    return ".";
  }
  return relative;
}

// Normalize Windows "\" separators to "/" so matching behaves consistently.
function toPosix(value) {
  return String(value || "").replace(/\\/g, "/");
}

// FileType values can be bitmasks, so use a helper instead of direct equality.
function hasFileType(fileType, expectedType) {
  return (fileType & expectedType) === expectedType;
}

// Reject paths that would escape above the workspace root.
function isWithinRoot(candidatePath, rootPath) {
  const normalizedCandidate = path.resolve(candidatePath);
  const normalizedRoot = path.resolve(rootPath);
  const relative = path.relative(normalizedRoot, normalizedCandidate);
  if (!relative) {
    return true;
  }
  return !relative.startsWith("..") && !path.isAbsolute(relative);
}

module.exports = {
  hasFileType,
  isWithinRoot,
  resolveFolderUri,
  resolveWorkspaceFolder,
  toPosix,
  toWorkspaceRelativePath,
  tryStatUri,
  uriExists
};
