import * as vscode from "vscode";
import parse = require("json-to-ast");

function getQuestionFilePath(qid: string): vscode.Uri {
  return vscode.Uri.file(
    `/Users/nathan/git/PrairieLearn/exampleCourse/questions/${qid}`
  );
}

const jsonParserSettings = {
  loc: true
};

export class LinkProvider implements vscode.DocumentLinkProvider {
  provideDocumentLinks(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.DocumentLink[]> {
    // throw new Error("Method not implemented.");
    console.log("getting links... right now");
    try {
      const jsonAst = parse(document.getText(), jsonParserSettings);
      console.log("links? got.");
      console.log(jsonAst);
    } catch (e) {
      console.error("rip");
      console.error(e);
    }
    const documentLinks: vscode.DocumentLink[] = [];
    const start = new vscode.Position(1, 8);
    const end = start.translate(0, 10);
    const range = new vscode.Range(start, end);
    const link = new vscode.DocumentLink(
      range,
      getQuestionFilePath("addNumbers")
    );
    documentLinks.push(link);
    return documentLinks;
  }
}
