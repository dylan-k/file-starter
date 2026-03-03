# File Starter

Create new files from workspace templates with configurable variable syntax.


Command
--------------------------------------------------------------------------------

  - `File Starter: New File from Template`

You can run this from Command Palette, Explorer context menu, or editor context menu.


Default Behavior
--------------------------------------------------------------------------------

  - Template directory: `.vscode/templates`
  - Template pattern: `*.template.md`
  - Variable syntaxes: `{{variable}}`, `${variable}`, `{variable}`

Use settings below to alter these defaults.


Built-in Variables
--------------------------------------------------------------------------------

  - `title`
  - `name` (same as `title`)
  - `date` (local `YYYY-MM-DD`)
  - `datetime` (ISO timestamp with local timezone offset)
  - `year`, `month`, `day`
  - `file` (output file name with extension)
  - `filename` (output file name without extension)
  - `extension` (output extension without leading dot)
  - `template` (selected template label)


Settings
--------------------------------------------------------------------------------

  - `fileStarter.templateDirectory`
      : Template directory, relative to workspace root.

  - `fileStarter.templateFilePattern`
      : Glob pattern used to discover template files.

  - `fileStarter.defaultDestination`
      : Default output folder relative to workspace root. Empty means infer from current context.

  - `fileStarter.variableSyntaxes`
      : Variable delimiters to process in template content.

  - `fileStarter.customVariables`
      : Custom variables available in template rendering.


Local Development
--------------------------------------------------------------------------------

1. Open this folder in VS Code.
2. Run `Developer: Run Extension` (or launch an Extension Development Host from this folder).
3. In the Extension Development Host, run `File Starter: New File from Template`.

### Local Install

```
### one-time: install the packaging tool
npm install -g @vscode/vsce

### package the extension
vsce package

### install the resulting .vsix
code --install-extension file-starter-0.0.1.vsix
```
