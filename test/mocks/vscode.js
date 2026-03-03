"use strict";

const path = require("path");

module.exports = {
  FileType: { File: 1, Directory: 2 },
  Uri: {
    file: (p) => ({ fsPath: p }),
    joinPath: (base, ...parts) => ({
      fsPath: path.join(base.fsPath, ...parts),
    }),
  },
  workspace: {
    fs: {
      readDirectory: async () => [],
      stat: async () => null,
    },
    getConfiguration: () => ({ get: () => undefined }),
    getWorkspaceFolder: () => null,
    workspaceFolders: [],
  },
  window: {
    activeTextEditor: null,
    showQuickPick: async () => null,
    showInputBox: async () => null,
    showErrorMessage: () => {},
    showWarningMessage: () => {},
    showInformationMessage: () => {},
  },
  commands: {
    registerCommand: () => ({ dispose: () => {} }),
  },
};
