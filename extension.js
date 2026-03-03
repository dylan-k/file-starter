"use strict";

/**
 * File Starter VS Code extension
 *
 * Overall behavior:
 * - Registers the command `fileStarter.createFile`.
 * - Delegates the user-facing workflow to a focused command module.
 * - Keeps the entrypoint intentionally small so the rest of the extension can
 *   be read in smaller, purpose-specific files.
 *
 * Contributed command:
 * - `File Starter: New File from Template`
 *
 * Main runtime modules:
 * - `commands/createFileFromTemplate.js`
 * - `services/pathing.js`
 * - `services/templateDiscovery.js`
 * - `services/templateRendering.js`
 * - `services/validation.js`
 */
const vscode = require("vscode");

const { COMMAND_ID } = require("./constants");
const { makeNewFileFromTemplate } = require("./commands/createFileFromTemplate");

/*
 * ============================================================================
 * Extension lifecycle
 * ============================================================================
 *
 * VS Code loads this file first because package.json points `main` at it.
 * This file does only two jobs:
 * 1. Register the command id declared in package.json.
 * 2. Export the standard activate()/deactivate() entrypoints.
 */

/**
 * Wire the extension command into VS Code.
 *
 * The heavy lifting lives in `makeNewFileFromTemplate()`, which keeps this
 * entrypoint small and lets the rest of the codebase be split into simpler
 * modules.
 */
function activate(context) {
  const disposable = vscode.commands.registerCommand(COMMAND_ID, async (uri) => {
    await makeNewFileFromTemplate(uri);
  });

  context.subscriptions.push(disposable);
}

/**
 * No cleanup is needed right now, but VS Code expects the module shape to
 * include deactivate() when an extension exports activate().
 */
function deactivate() {}

module.exports = {
  activate,
  deactivate
};
