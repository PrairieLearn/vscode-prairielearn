declare module "json-to-ast" {
  interface Settings {
    loc?: boolean;
    source?: string;
  }

  interface JSONObject {
    type: "Object";
    children: JSONProperty[];
  }

  interface JSONProperty {
    type: "property";
    key: JSONIdentifier;
    value: JSONObject | JSONArray | JSONLiteral;
  }

  interface JSONIdentifier {
    type: "Identifier";
    value: string;
    raw: string;
  }

  interface JSONArray {
    type: "Array";
    children: (JSONObject | JSONArray | JSONLiteral)[];
  }

  interface JSONLiteral {
    type: "Literal";
    value: string | number | boolean | null;
    raw: string;
  }

  function parse(
    input: string,
    settings: Settings
  ): JSONObject | JSONArray | JSONLiteral;

  export = parse;
}
