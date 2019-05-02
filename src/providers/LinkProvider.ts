import * as vscode from "vscode";
import parse, {
  ParseSettings,
  JSONDocument,
  JSONObject,
  JSONArray
} from "../util/json-to-ast";

function getQuestionFilePath(qid: string): vscode.Uri {
  return vscode.Uri.file(
    `/Users/nathan/git/PrairieLearn/exampleCourse/questions/${qid}/question.html`
  );
}

function parseDocument(doc: string): JSONDocument | null {
  try {
    return parse(doc, jsonParserSettings);
  } catch (e) {
    return null;
  }
}

function buildLinksFromZoneQuestions(
  questions: JSONArray
): vscode.DocumentLink[] {
  const links: vscode.DocumentLink[] = [];
  questions.children.forEach(question => {
    if (question.type !== "Object") {
      return;
    }
    const qidProp = question.children.find(prop => prop.key.value === "id");
    if (!qidProp || qidProp.value.type !== "Literal") {
      return;
    }
    const qid = qidProp.value;
    console.log(qid);
    const startLoc = qid.loc!.start;
    const endLoc = qid.loc!.end;
    // The AST has location info in 1-indexed form, but VSCode expects it to be
    // 0-indexed. We also want to exclude the quotes surrounding the value.
    const start = new vscode.Position(startLoc.line - 1, startLoc.column);
    const end = new vscode.Position(endLoc.line - 1, endLoc.column - 2);
    const range = new vscode.Range(start, end);
    const link = new vscode.DocumentLink(
      range,
      getQuestionFilePath(qid.value as string)
    );
    links.push(link);
  });
  return links;
}

function buildLinks(document: JSONObject): vscode.DocumentLink[] {
  const links: vscode.DocumentLink[] = [];
  const zones = document.children.find(prop => prop.key.value === "zones");
  if (!zones || zones.value.type !== "Array") {
    // Malformed document
    return [];
  }
  zones.value.children.forEach(zone => {
    if (zone.type !== "Object") {
      return;
    }
    const zoneQuestions = zone.children.find(
      prop => prop.key.value === "questions"
    );
    if (!zoneQuestions || zoneQuestions.value.type !== "Array") {
      return;
    }
    links.push(...buildLinksFromZoneQuestions(zoneQuestions.value));
  });
  return links;
}

const jsonParserSettings: ParseSettings = {
  loc: true
};

export class LinkProvider implements vscode.DocumentLinkProvider {
  provideDocumentLinks(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.DocumentLink[]> {
    const jsonAst = parseDocument(document.getText());
    if (jsonAst === null) {
      // Probably a parser error; do nothing for now.
      return [];
    }
    if (jsonAst.type === "Array" || jsonAst.type === "Literal") {
      // Malformed document, we can't handle this.
      return [];
    }

    return buildLinks(jsonAst);
  }
}
