"use strict";

/**
 * Create-file command
 *
 * This module contains the main user-facing workflow for the extension:
 * choose a template, choose an output location, gather file details, render the
 * template, then create and open the resulting file.
 */
const path = require("path");
const vscode = require("vscode");

const {
  CONFIG_SCOPE,
  DEFAULT_TEMPLATE_DIRECTORY,
  DEFAULT_TEMPLATE_PATTERN
} = require("../constants");
const {
  resolveWorkspaceFolder,
  resolveFolderUri,
  tryStatUri,
  uriExists,
  toWorkspaceRelativePath,
  isWithinRoot,
  hasFileType
} = require("../services/pathing");
const {
  findTemplateFiles,
  determineOutputExtension
} = require("../services/templateDiscovery");
const {
  normalizeVariableSyntaxes,
  buildVariables,
  renderTemplate
} = require("../services/templateRendering");
const {
  buildSuggestedFileName,
  validateFileName
} = require("../services/validation");

/*
 * ============================================================================
 * Main command workflow
 * ============================================================================
 *
 * This is the interactive path the user experiences inside VS Code.
 */

/**
 * Prompt the user for the information needed to create a new file from a
 * template, then render and open the result.
 */
async function makeNewFileFromTemplate(targetUri) {
  // This extension is workspace-relative, so we stop early if VS Code cannot
  // resolve a current folder or workspace.
  const workspaceFolder = resolveWorkspaceFolder(targetUri);
  if (!workspaceFolder) {
    vscode.window.showErrorMessage("Open a workspace folder before creating a file from template.");
    return;
  }

  // Load the user configuration for the current workspace folder.
  const config = vscode.workspace.getConfiguration(CONFIG_SCOPE, workspaceFolder.uri);
  const templateDirectory = config.get("templateDirectory", DEFAULT_TEMPLATE_DIRECTORY);
  const templatePattern = config.get("templateFilePattern", DEFAULT_TEMPLATE_PATTERN);
  const templateDirectoryUri = resolveFolderUri(workspaceFolder.uri, templateDirectory);

  // Fail early when the configured template directory does not exist.
  if (!(await uriExists(templateDirectoryUri))) {
    vscode.window.showErrorMessage(
      `Template folder not found: ${toWorkspaceRelativePath(templateDirectoryUri.fsPath, workspaceFolder.uri.fsPath)}`
    );
    return;
  }

  // Find templates under the configured folder and let the user pick one.
  const templates = await findTemplateFiles(templateDirectoryUri, templatePattern);
  if (templates.length === 0) {
    vscode.window.showWarningMessage(
      `No templates found in "${toWorkspaceRelativePath(templateDirectoryUri.fsPath, workspaceFolder.uri.fsPath)}" using pattern "${templatePattern}".`
    );
    return;
  }

  const templatePick = await vscode.window.showQuickPick(
    templates.map((item) => ({
      label: item.displayLabel,
      description: item.relativePath,
      detail: item.uri.fsPath,
      item
    })),
    {
      placeHolder: "Select a template"
    }
  );

  if (!templatePick) {
    return;
  }

  const template = templatePick.item;
  const outputExtension = determineOutputExtension(template.fileName);

  // Suggest a destination based on the clicked folder, clicked file, or active
  // editor, but still let the user override it.
  const inferredDestination = await inferDestinationFolder(targetUri, workspaceFolder, config);
  const destinationInput = await vscode.window.showInputBox({
    prompt: "Destination folder (relative to workspace root)",
    value: inferredDestination,
    validateInput: (value) => {
      const trimmed = (value || "").trim();
      if (trimmed.length === 0) {
        return null;
      }

      if (path.isAbsolute(trimmed)) {
        return "Use a path relative to the workspace root.";
      }

      const resolved = path.resolve(workspaceFolder.uri.fsPath, trimmed);
      if (!isWithinRoot(resolved, workspaceFolder.uri.fsPath)) {
        return "Destination must stay within the current workspace.";
      }

      return null;
    }
  });

  if (typeof destinationInput === "undefined") {
    return;
  }

  // Create the destination folder if needed, but reject the case where the
  // chosen path is already a file.
  const destinationUri = resolveFolderUri(workspaceFolder.uri, destinationInput || ".");
  const destinationStat = await tryStatUri(destinationUri);
  if (destinationStat && hasFileType(destinationStat.type, vscode.FileType.File)) {
    vscode.window.showErrorMessage("Destination must be a folder, not an existing file.");
    return;
  }
  await vscode.workspace.fs.createDirectory(destinationUri);

  // Ask for the user-facing title. Templates often use this directly in the
  // generated content or frontmatter.
  const titleInput = await vscode.window.showInputBox({
    prompt: "Title",
    value: "",
    validateInput: (value) => {
      if (!value || value.trim().length === 0) {
        return "Title is required.";
      }
      return null;
    }
  });

  if (typeof titleInput === "undefined") {
    return;
  }

  const title = titleInput.trim();

  // Generate a safe initial file-name suggestion, then validate any user edits
  // against a conservative cross-platform rule set.
  const suggestedFileName = buildSuggestedFileName(title, outputExtension);
  const fileNameInput = await vscode.window.showInputBox({
    prompt: "File name",
    value: suggestedFileName,
    validateInput: (value) => {
      return validateFileName(value);
    }
  });

  if (typeof fileNameInput === "undefined") {
    return;
  }

  const fileName = fileNameInput.trim();
  const outputUri = vscode.Uri.joinPath(destinationUri, fileName);

  // Avoid overwriting an existing file without explicit user intent.
  if (await uriExists(outputUri)) {
    vscode.window.showErrorMessage(`File already exists: ${outputUri.fsPath}`);
    return;
  }

  // Read the template, compute the available variables, render the content, and
  // write the new file to disk.
  const sourceBytes = await vscode.workspace.fs.readFile(template.uri);
  const sourceContent = Buffer.from(sourceBytes).toString("utf8");
  const variableSyntaxes = normalizeVariableSyntaxes(config.get("variableSyntaxes", []));
  const variables = buildVariables({
    title,
    fileName,
    templateName: template.displayLabel,
    config
  });
  const rendered = renderTemplate(sourceContent, variables, variableSyntaxes);

  await vscode.workspace.fs.writeFile(outputUri, Buffer.from(rendered, "utf8"));

  // Open the newly created file so the user can continue immediately.
  const document = await vscode.workspace.openTextDocument(outputUri);
  await vscode.window.showTextDocument(document);
  vscode.window.showInformationMessage(
    `Created ${toWorkspaceRelativePath(outputUri.fsPath, workspaceFolder.uri.fsPath)} from template ${template.displayLabel}.`
  );
}

/*
 * ============================================================================
 * Destination inference
 * ============================================================================
 *
 * This helper lives next to the command because it is tightly coupled to the
 * UX of where the command was launched from.
 */

/**
 * Choose a sensible default destination folder for the new file.
 *
 * Preference order:
 * 1. The configured default destination, if present.
 * 2. The clicked folder or the parent folder of the clicked file.
 * 3. The parent folder of the active editor file.
 * 4. The workspace root.
 */
async function inferDestinationFolder(targetUri, workspaceFolder, config) {
  const configuredDefault = (config.get("defaultDestination", "") || "").trim();
  if (configuredDefault) {
    return configuredDefault;
  }

  const workspaceRootPath = workspaceFolder.uri.fsPath;
  const editorUri = vscode.window.activeTextEditor?.document?.uri;
  const contextUri = targetUri || (editorUri?.scheme === "file" ? editorUri : null);

  if (!contextUri?.fsPath) {
    return ".";
  }

  const contextStat = await tryStatUri(contextUri);
  let destinationPath = ".";

  if (contextStat) {
    destinationPath = hasFileType(contextStat.type, vscode.FileType.Directory)
      ? contextUri.fsPath
      : path.dirname(contextUri.fsPath);
  } else if (editorUri && contextUri.toString() === editorUri.toString()) {
    // The active editor context is file-oriented even if the file cannot be
    // stat'ed at the exact moment this helper runs.
    destinationPath = path.dirname(contextUri.fsPath);
  }

  if (!isWithinRoot(destinationPath, workspaceRootPath)) {
    return ".";
  }

  return toWorkspaceRelativePath(destinationPath, workspaceRootPath);
}

module.exports = {
  makeNewFileFromTemplate
};
