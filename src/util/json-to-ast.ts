import originalParse = require("json-to-ast");

export interface ParseSettings {
  loc?: boolean;
  source?: string;
}

export interface JSONPosition {
  line: number;
  column: number;
  offset: number;
}

export interface JSONLocation {
  start: JSONPosition;
  end: JSONPosition;
  source?: string;
}

export interface JSONObject {
  type: "Object";
  children: JSONProperty[];
  loc?: JSONLocation;
}

export interface JSONProperty {
  type: "Property";
  key: JSONIdentifier;
  value: JSONObject | JSONArray | JSONLiteral;
  loc?: JSONLocation;
}

export interface JSONIdentifier {
  type: "Identifier";
  value: string;
  raw: string;
  loc?: JSONLocation;
}

export interface JSONArray {
  type: "Array";
  children: (JSONObject | JSONArray | JSONLiteral)[];
  loc?: JSONLocation;
}

export interface JSONLiteral {
  type: "Literal";
  value: string | number | boolean | null;
  raw: string;
  loc?: JSONLocation;
}

export type JSONDocument = JSONObject | JSONArray | JSONLiteral;

function parse(input: string, settings: ParseSettings): JSONDocument {
  return originalParse(input, settings);
}

export default parse;
