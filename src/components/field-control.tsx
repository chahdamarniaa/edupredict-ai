import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FieldSpec } from "@/types/api";
import { fieldMeta } from "@/lib/fields";

export function rangeText(f: FieldSpec) {
  if (f.min === undefined && f.max === undefined) return undefined;
  const lo = f.min !== undefined ? `${f.exclusiveMin ? ">" : "≥"} ${f.min}` : "";
  const hi = f.max !== undefined ? `${f.exclusiveMax ? "<" : "≤"} ${f.max}` : "";
  if (f.min !== undefined && f.max !== undefined && !f.exclusiveMin && !f.exclusiveMax) return `${f.min}–${f.max}`;
  return [lo, hi].filter(Boolean).join(", ");
}

export function FieldControl({
  field,
  value,
  error,
  onChange,
}: {
  field: FieldSpec;
  value: string | boolean;
  error?: string;
  onChange: (v: string | boolean) => void;
}) {
  const meta = fieldMeta(field.name, field.title);
  const id = `f-${field.name}`;
  const range = rangeText(field);
  const help = [field.description, meta.hint].filter(Boolean).join(" · ");
  const describedBy = `${id}-help ${error ? `${id}-err` : ""}`;

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id} className="text-sm font-medium text-foreground">
          {meta.label}
          {field.required && <span className="ml-0.5 text-destructive" aria-hidden>*</span>}
        </Label>
        {range && <span className="font-mono text-xs text-muted-foreground">{range}</span>}
      </div>

      {field.type === "enum" && (
        <Select value={value === "" ? undefined : String(value)} onValueChange={onChange}>
          <SelectTrigger id={id} aria-invalid={!!error} aria-describedby={describedBy} className="bg-card">
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            {field.options!.map((o) => (
              <SelectItem key={String(o)} value={String(o)}>
                {String(o)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {field.type === "boolean" && (
        <div className="flex h-10 items-center gap-3">
          <Switch id={id} checked={value === true} onCheckedChange={onChange} aria-describedby={describedBy} />
          <span className="text-sm text-muted-foreground">{value === true ? "Yes" : "No"}</span>
        </div>
      )}

      {(field.type === "integer" || field.type === "number") && (
        <Input
          id={id}
          type="number"
          inputMode={field.type === "integer" ? "numeric" : "decimal"}
          step={field.type === "integer" ? 1 : "any"}
          min={field.min}
          max={field.max}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className="bg-card font-mono"
        />
      )}

      {field.type === "string" && (
        <Input id={id} value={String(value)} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error} aria-describedby={describedBy} className="bg-card" />
      )}

      <p id={`${id}-help`} className="text-xs text-muted-foreground">
        {help}
      </p>
      {error && (
        <p id={`${id}-err`} className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function validateField(f: FieldSpec, v: string | boolean): string | undefined {
  if (f.type === "boolean") return;
  const s = String(v).trim();
  if (s === "") return f.required ? "This field is required." : undefined;
  if (f.type === "enum") return f.options!.map(String).includes(s) ? undefined : "Choose one of the allowed values.";
  if (f.type === "integer" || f.type === "number") {
    const n = Number(s);
    if (!Number.isFinite(n)) return "Enter a number.";
    if (f.type === "integer" && !Number.isInteger(n)) return "Enter a whole number.";
    if (f.min !== undefined && (f.exclusiveMin ? n <= f.min : n < f.min)) return `Must be ${f.exclusiveMin ? "greater than" : "at least"} ${f.min}.`;
    if (f.max !== undefined && (f.exclusiveMax ? n >= f.max : n > f.max)) return `Must be ${f.exclusiveMax ? "less than" : "at most"} ${f.max}.`;
  }
}

export function toPayloadValue(f: FieldSpec, v: string | boolean) {
  if (f.type === "boolean") return v === true;
  const s = String(v).trim();
  if (s === "") return undefined;
  if (f.type === "integer" || f.type === "number") return Number(s);
  if (f.type === "enum") return f.options!.find((o) => String(o) === s);
  return s;
}

export function initialValue(f: FieldSpec): string | boolean {
  if (f.type === "boolean") return f.default === true;
  return f.default === undefined || f.default === null ? "" : String(f.default);
}
