/** Helpers that read whatever shape the backend returns, without inventing values. */
import type { JsonValue } from "@/types/api";

type Obj = Record<string, JsonValue>;
export const isObj = (v: unknown): v is Obj => !!v && typeof v === "object" && !Array.isArray(v);

export function findKey(o: unknown, re: RegExp, pred: (v: JsonValue) => boolean = () => true): [string, JsonValue] | undefined {
  if (!isObj(o)) return;
  for (const [k, v] of Object.entries(o)) if (re.test(k) && pred(v)) return [k, v];
  for (const v of Object.values(o)) {
    if (isObj(v)) {
      const r = findKey(v, re, pred);
      if (r) return r;
    }
  }
}
const isNum = (v: JsonValue) => typeof v === "number" && Number.isFinite(v);
const isStr = (v: JsonValue) => typeof v === "string" && v.length > 0;

export function readPrediction(res: JsonValue) {
  if (typeof res === "number") return { grade: res as number, raw: res };
  const grade =
    findKey(res, /^(predicted_?(final_?)?grade|predicted_?g3|prediction|predicted_value|g3|grade|predicted)$/i, isNum)?.[1] ??
    findKey(res, /predict|grade/i, isNum)?.[1];
  const category = findKey(res, /category|level|band|label|class|performance/i, isStr)?.[1] as string | undefined;
  let scaleMin: number | undefined;
  let scaleMax: number | undefined;
  const scale = findKey(res, /scale|range/i);
  if (scale) {
    const v = scale[1];
    if (isObj(v)) {
      scaleMin = typeof v.min === "number" ? v.min : undefined;
      scaleMax = typeof v.max === "number" ? v.max : undefined;
    } else if (Array.isArray(v) && v.length === 2 && v.every((x) => typeof x === "number")) {
      [scaleMin, scaleMax] = v as number[];
    } else if (typeof v === "string") {
      const m = v.match(/(-?\d+(?:\.\d+)?)\s*(?:-|–|to)\s*(-?\d+(?:\.\d+)?)/);
      if (m) [scaleMin, scaleMax] = [Number(m[1]), Number(m[2])];
    }
  }
  scaleMax ??= findKey(res, /^(max_?grade|grade_?max|scale_?max)$/i, isNum)?.[1] as number | undefined;
  scaleMin ??= findKey(res, /^(min_?grade|grade_?min|scale_?min)$/i, isNum)?.[1] as number | undefined;
  if (scaleMax !== undefined) scaleMin ??= 0;
  const message = findKey(res, /message|explanation|interpretation|description|note/i, isStr)?.[1] as string | undefined;
  return { grade: (grade as number | undefined) ?? null, category, scaleMin, scaleMax, message, raw: res };
}

/** Flattens nested metric objects into labelled groups of numeric values. */
export function metricGroups(data: JsonValue): Array<{ name: string; values: Record<string, number> }> {
  const groups: Array<{ name: string; values: Record<string, number> }> = [];
  const walk = (o: JsonValue, name: string) => {
    if (!isObj(o)) return;
    const values: Record<string, number> = {};
    for (const [k, v] of Object.entries(o)) {
      if (typeof v === "number" && Number.isFinite(v)) values[k] = v;
      else if (isObj(v)) walk(v, name ? `${name} · ${k}` : k);
    }
    if (Object.keys(values).length) groups.push({ name: name || "Overall", values });
  };
  walk(data, "");
  return groups;
}

export function metricKind(key: string): "mae" | "rmse" | "r2" | "mse" | null {
  const k = key.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (/^(test)?(mae|meanabsoluteerror)/.test(k) || k.endsWith("mae")) return "mae";
  if (k.includes("rmse")) return "rmse";
  if (/r2|rsquared|r²/.test(k)) return "r2";
  if (k.endsWith("mse")) return "mse";
  return null;
}

export const METRIC_INFO = {
  mae: { name: "MAE", full: "Mean Absolute Error", text: "Average size of prediction errors, in grade points. Lower is better." },
  rmse: { name: "RMSE", full: "Root Mean Squared Error", text: "Like MAE but penalises large errors more heavily. Lower is better." },
  r2: { name: "R²", full: "Coefficient of determination", text: "Share of the variation in final grades explained by the model. Closer to 1 is better." },
  mse: { name: "MSE", full: "Mean Squared Error", text: "Average squared error. Lower is better." },
};

export function modelType(...sources: unknown[]): string | undefined {
  for (const s of sources) {
    const r = findKey(s, /^(model_?(type|name|class)?|algorithm|estimator|regressor)$/i, isStr);
    if (r) return r[1] as string;
  }
}

export function healthState(data: unknown, error: unknown): "online" | "not-ready" | "offline" | "unknown" {
  if (error) return "offline";
  if (data === undefined) return "unknown";
  const ready = findKey(data, /model_?(loaded|ready)|^ready$|^loaded$/i, (v) => typeof v === "boolean");
  if (ready && ready[1] === false) return "not-ready";
  const status = findKey(data, /^status$/i, isStr);
  if (status && /error|fail|down|unavailable|not/i.test(String(status[1]))) return "not-ready";
  return "online";
}

export const prettyKey = (k: string) => k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
export const fmt = (n: number) => (Math.abs(n) >= 100 ? n.toFixed(0) : n.toFixed(3).replace(/\.?0+$/, "") || "0");
