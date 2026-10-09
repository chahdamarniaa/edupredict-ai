export interface FieldSpec {
  name: string;
  type: "enum" | "integer" | "number" | "boolean" | "string";
  options?: Array<string | number>;
  min?: number;
  max?: number;
  exclusiveMin?: boolean;
  exclusiveMax?: boolean;
  required: boolean;
  title?: string;
  description?: string;
  default?: unknown;
}

export type FormValues = Record<string, string | boolean>;

export type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };
export type JsonObject = { [k: string]: JsonValue };

export interface HistoryEntry {
  id: string;
  at: string;
  grade: number | null;
  category?: string;
  response: JsonValue;
}
