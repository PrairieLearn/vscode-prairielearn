import * as vscode from "vscode";
import * as path from "path";
import parse, {
  ParseSettings,
  JSONDocument,
  JSONObject,
  JSONArray
} from "../util/json-to-ast";
import * as fs from "fs-extra";

interface FileContext {
  prairieLearnRoot: string;
}

/**
 * Checks if the specified path corresponds to a file.
 * @param path The path to check
 */
async function checkIsFile(path: string): Promise<boolean> {
  try {
    return (await fs.stat(path)).isFile();
  } catch (e) {
    return false;
  }
}

/**
 * Walks up from the current directory looking for the first directory
 * containing a `infoCourse.json` file.
 * @param document The document to find the PrairieLearn root for.
 */
async function findPrairieLearnRoot(
  document: vscode.TextDocument
): Promise<string | null> {
  const root = vscode.workspace.getWorkspaceFolder(document.uri);
  if (!root) {
    return null;
  }
  const current = path.dirname(document.uri.fsPath);
  return await nearestInfoCourse(root.uri.fsPath, current);
}

async function nearestInfoCourse(
  rootPath: string,
  currentPath: string
): Promise<string | null> {
  const infoCoursePath = path.join(currentPath, "infoCourse.json");
  const isFile = await checkIsFile(infoCoursePath);
  if (isFile) {
    // We found it!
    return currentPath;
  }
  if (currentPath === rootPath) {
    // We got to the workspace root without finding it
    return null;
  }
  return await nearestInfoCourse(rootPath, path.join(currentPath, ".."));
}

/**
 * Checks if the given document resides under a PrairieLearn course directory.
 * @param document The document to check.
 */
async function isInPrairieLearnCourse(
  document: vscode.TextDocument
): Promise<boolean> {
  const prairieLearnRoot = await findPrairieLearnRoot(document);
  return prairieLearnRoot !== null;
}

/**
 *
 * Checks if the given document is named `infoAssessment.json`.
 * @param document The document to check.
 */
function isDocumentInfoAssessmentFile(document: vscode.TextDocument): boolean {
  const name = path.basename(document.fileName);
  return name === "infoAssessment.json";
}

/**
 * Generates a VSCode URI for the specified QID.
 * @param prairieLearnRoot The root of the PrairieLearn course.
 * @param qid The QID of the
 */
function getQuestionUri(prairieLearnRoot: string, qid: string): vscode.Uri {
  return vscode.Uri.file(
    path.join(prairieLearnRoot, "questions", qid, "question.html")
  );
}

/**
 *
 * Parses a JSON string into an AST, or null if that fails.
 * @param doc The text to parse as JSON.
 */
function parseDocument(doc: string): JSONDocument | null {
  try {
    return parse(doc, jsonParserSettings);
  } catch (e) {
    return null;
  }
}

function buildLinksFromZoneQuestions(
  context: FileContext,
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
    const startLoc = qid.loc!.start;
    const endLoc = qid.loc!.end;
    // The AST has location info in 1-indexed form, but VSCode expects it to be
    // 0-indexed. We also want to exclude the quotes surrounding the value.
    const start = new vscode.Position(startLoc.line - 1, startLoc.column);
    const end = new vscode.Position(endLoc.line - 1, endLoc.column - 2);
    const range = new vscode.Range(start, end);
    const link = new vscode.DocumentLink(
      range,
      getQuestionUri(context.prairieLearnRoot, qid.value as string)
    );
    links.push(link);
  });
  return links;
}

function buildLinks(
  context: FileContext,
  document: JSONObject
): vscode.DocumentLink[] {
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
    links.push(...buildLinksFromZoneQuestions(context, zoneQuestions.value));
  });
  return links;
}

const jsonParserSettings: ParseSettings = {
  loc: true
};

function promiseWrapper<T>(func: () => Promise<T>): Promise<T> {
  return new Promise(async (resolve, reject) => {
    try {
      resolve(await func());
    } catch (e) {
      console.error(e);
      reject(e);
    }
  });
}

export class LinkProvider implements vscode.DocumentLinkProvider {
  provideDocumentLinks(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.DocumentLink[]> {
    return promiseWrapper(
      async (): Promise<vscode.DocumentLink[]> => {
        const isPLCourse = await isInPrairieLearnCourse(document);
        if (!isDocumentInfoAssessmentFile(document) || !isPLCourse) {
          return [];
        }
        const jsonAst = parseDocument(document.getText());
        if (jsonAst === null) {
          // Probably a parser error; do nothing for now.
          return [];
        }
        if (jsonAst.type === "Array" || jsonAst.type === "Literal") {
          // Malformed document, we can't handle this.
          return [];
        }
        const prairieLearnRoot = await findPrairieLearnRoot(document);
        if (prairieLearnRoot === null) {
          return [];
        }

        const context: FileContext = {
          prairieLearnRoot
        };

        return buildLinks(context, jsonAst);
      }
    );
  }
}
