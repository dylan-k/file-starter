"use strict";

const Module = require("module");
const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function (request, parent, ...rest) {
  if (request === "vscode") {
    return require.resolve("../mocks/vscode.js");
  }
  return originalResolveFilename.call(this, request, parent, ...rest);
};
