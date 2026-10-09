/**
 * Reads the backend's live OpenAPI document and discovers endpoints and the
 * exact prediction request schema, so field names / enums are never assumed.
 */
import type { FieldSpec } from "@/types/api";

type Schema = Record<string, any>;
export type OpenApiSpec = { paths?: Record<string, Record<string, any>>; components?: { schemas?: Record<string, Schema> }; info?: { title?: string; version?: string } };

export interface DiscoveredEndpoints {
  title?: string;
  version?: string;
  health?: string;
  metrics?: string;
  featureSchema?: string;
  analytics?: string;
  predict?: { path: string; fields: FieldSpec[]; wrapKey?: string };
  allPaths: string[];
}

function resolve(spec: OpenApiSpec, s: Schema | undefined, depth = 0): Schema {
  if (!s || depth > 10) return {};
  if (s.$ref) {
    const name = String(s.$ref).split("/").pop()!;
    return resolve(spec, spec.components?.schemas?.[name], depth + 1);
  }
  if (s.allOf?.length === 1) return { ...resolve(spec, s.allOf[0], depth + 1), ...omit(s, "allOf") };
  const union = s.anyOf ?? s.oneOf;
  if (union) {
    const nonNull = union.filter((u: Schema) => u.type !== "null");
    if (nonNull.length === 1) return { ...resolve(spec, nonNull[0], depth + 1), ...omit(s, "anyOf", "oneOf"), nullable: true };
  }
  return s;
}
function omit(o: Schema, ...keys: string[]) {
  const c = { ...o };
  keys.forEach((k) => delete c[k]);
  return c;
}

function toFields(spec: OpenApiSpec, obj: Schema): FieldSpec[] {
  const required: string[] = obj.required ?? [];
  return Object.entries<Schema>(obj.properties ?? {}).map(([name, raw]) => {
    const s = resolve(spec, raw);
    let type: FieldSpec["type"] = "string";
    let options: Array<string | number> | undefined;
    const enumVals = s.enum ?? (s.const !== undefined ? [s.const] : undefined);
    if (enumVals) {
      type = "enum";
      options = enumVals;
    } else if (s.type === "integer") type = "integer";
    else if (s.type === "number") type = "number";
    else if (s.type === "boolean") type = "boolean";
    const min = s.minimum ?? (s.exclusiveMinimum !== undefined ? s.exclusiveMinimum : undefined);
    const max = s.maximum ?? (s.exclusiveMaximum !== undefined ? s.exclusiveMaximum : undefined);
    return {
      name,
      type,
      options,
      min: typeof min === "number" ? min : undefined,
      max: typeof max === "number" ? max : undefined,
      exclusiveMin: s.exclusiveMinimum !== undefined,
      exclusiveMax: s.exclusiveMaximum !== undefined,
      required: required.includes(name) && s.default === undefined,
      title: s.title,
      description: s.description,
      default: s.default,
    };
  });
}

function findGet(paths: Record<string, Record<string, any>>, re: RegExp, exclude?: RegExp) {
  return Object.keys(paths).find((p) => paths[p].get && re.test(p) && !(exclude && exclude.test(p)));
}

export function discover(spec: OpenApiSpec): DiscoveredEndpoints {
  const paths = spec.paths ?? {};
  const out: DiscoveredEndpoints = {
    title: spec.info?.title,
    version: spec.info?.version,
    allPaths: Object.keys(paths),
    health: findGet(paths, /health|status|ready/i),
    metrics: findGet(paths, /metric|evaluat|performance/i),
    featureSchema: findGet(paths, /feature|schema|columns|inputs/i, /importance/i),
    analytics: findGet(paths, /analytic|summary|stats|insight/i),
  };
  const predictPath =
    Object.keys(paths).find((p) => paths[p].post && /predict/i.test(p) && !/batch/i.test(p)) ??
    Object.keys(paths).find((p) => paths[p].post && /predict/i.test(p));
  if (predictPath) {
    const body = resolve(spec, paths[predictPath].post?.requestBody?.content?.["application/json"]?.schema);
    let obj = body;
    let wrapKey: string | undefined;
    const props = Object.entries<Schema>(body.properties ?? {});
    if (props.length === 1) {
      const inner = resolve(spec, props[0][1]);
      if (inner.properties) {
        obj = inner;
        wrapKey = props[0][0];
      }
    }
    out.predict = { path: predictPath, fields: toFields(spec, obj), wrapKey };
  }
  return out;
}
