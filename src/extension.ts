// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { LinkProvider } from "./providers/LinkProvider";

class PrairieLearnDefinitionProvider implements vscode.DefinitionProvider {
  private config?: vscode.WorkspaceConfiguration;

  constructor(config?: vscode.WorkspaceConfiguration) {
    this.config = config;
  }

  provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<
    vscode.Location | vscode.Location[] | vscode.LocationLink[]
  > {
    throw new Error("Method not implemented.");
  }
}

const PL_MODE: vscode.DocumentFilter = { language: "json", scheme: "file" };

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "prairielearn-vscode" is now active!'
  );

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "extension.helloWorld",
    () => {
      // The code you place here will be executed every time your command is executed

      // Display a message box to the user
      vscode.window.showInformationMessage("Hello World!");
    }
  );

  context.subscriptions.push(disposable);

  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(
      PL_MODE,
      new PrairieLearnDefinitionProvider()
    )
  );
  context.subscriptions.push(
    vscode.languages.registerDocumentLinkProvider(["json"], new LinkProvider())
  );

  console.log("ACTIVATED");
}

// this method is called when your extension is deactivated
export function deactivate() {}
