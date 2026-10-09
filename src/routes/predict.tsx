import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileWarning, Loader2, Pencil, RotateCcw, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/app-shell";
import { Panel, ErrorState, EmptyState } from "@/components/states";
import { FieldControl, initialValue, toPayloadValue, validateField } from "@/components/field-control";
import { GradeGauge } from "@/components/grade-gauge";
import { useEndpoints } from "@/hooks/use-backend";
import { ApiError, apiPost } from "@/lib/api";
import { GROUPS, fieldMeta } from "@/lib/fields";
import { addHistory } from "@/lib/history";
import { isObj, prettyKey, readPrediction } from "@/lib/interpret";
import type { FieldSpec, FormValues, JsonValue } from "@/types/api";

export const Route = createFileRoute("/predict")({
  head: () => ({
    meta: [
      { title: "Predict Performance — Student Performance Predictor AI" },
      { name: "description", content: "Enter student information to estimate a final grade with the trained model." },
      { property: "og:title", content: "Predict Performance — Student Performance Predictor AI" },
      { property: "og:description", content: "Enter student information to estimate a final grade with the trained model." },
    ],
  }),
  component: PredictPage,
});

function PredictPage() {
  const ep = useEndpoints();
  return (
    <>
      <PageHeader eyebrow="Prediction" title="Predict Performance" subtitle="Fields, allowed values and ranges are loaded live from the backend schema." />
      {ep.isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      )}
      {ep.error && <ErrorState error={ep.error} onRetry={() => ep.refetch()} title="Couldn't load the input schema" />}
      {ep.data && !ep.data.predict && (
        <EmptyState icon={FileWarning} title="No prediction endpoint found">
          The backend's API documentation does not list a POST prediction route.
        </EmptyState>
      )}
      {ep.data?.predict && <PredictForm path={ep.data.predict.path} fields={ep.data.predict.fields} wrapKey={ep.data.predict.wrapKey} />}
    </>
  );
}

function PredictForm({ path, fields, wrapKey }: { path: string; fields: FieldSpec[]; wrapKey?: string }) {
  const blank = useMemo(() => Object.fromEntries(fields.map((f) => [f.name, initialValue(f)])) as FormValues, [fields]);
  const [values, setValues] = useState<FormValues>(blank);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<JsonValue | null>(null);

  const grouped = GROUPS.map((g) => ({ ...g, fields: fields.filter((f) => fieldMeta(f.name).group === g.id) })).filter((g) => g.fields.length);
  const hasGrades = fields.some((f) => /^g[12]$/i.test(f.name));

  const mutation = useMutation({
    mutationFn: (body: unknown) => apiPost<JsonValue>(path, body),
    onSuccess: (data) => {
      setResult(data);
      const p = readPrediction(data);
      addHistory({ id: crypto.randomUUID(), at: new Date().toISOString(), grade: p.grade, category: p.category, response: data });
      toast.success("Prediction complete");
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    onError: (err) => {
      if (err instanceof ApiError && Object.keys(err.fieldErrors).length) setErrors(err.fieldErrors);
      toast.error(err.message);
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mutation.isPending) return;
    const errs: Record<string, string> = {};
    fields.forEach((f) => {
      const m = validateField(f, values[f.name]);
      if (m) errs[f.name] = m;
    });
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.error(`Please fix ${Object.keys(errs).length} field(s).`);
      document.getElementById(`f-${Object.keys(errs)[0]}`)?.focus();
      return;
    }
    const payload: Record<string, unknown> = {};
    fields.forEach((f) => {
      const v = toPayloadValue(f, values[f.name]);
      if (v !== undefined) payload[f.name] = v;
    });
    mutation.mutate(wrapKey ? { [wrapKey]: payload } : payload);
  };

  const reset = () => {
    setValues(blank);
    setErrors({});
    mutation.reset();
  };

  if (result !== null)
    return (
      <ResultPanel
        data={result}
        onEdit={() => setResult(null)}
        onNew={() => {
          setResult(null);
          reset();
        }}
      />
    );

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      {mutation.error && (
        <ErrorState
          error={mutation.error}
          title="Prediction failed"
          onRetry={mutation.error instanceof ApiError && mutation.error.recoverable ? () => mutation.mutate(mutation.variables) : undefined}
        />
      )}
      {grouped.map((g) => (
        <Panel key={g.id} title={g.title} description={g.id === "grades" && hasGrades ? "The model uses earlier grades (G1, G2); they substantially improve prediction accuracy." : g.description}>
          <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
            {g.fields.map((f) => (
              <FieldControl
                key={f.name}
                field={f}
                value={values[f.name]}
                error={errors[f.name]}
                onChange={(v) => {
                  setValues((s) => ({ ...s, [f.name]: v }));
                  if (errors[f.name]) setErrors((s) => ({ ...s, [f.name]: "" }));
                }}
              />
            ))}
          </div>
        </Panel>
      ))}
      <div className="sticky bottom-0 -mx-4 flex flex-col-reverse gap-3 border-t border-border bg-background/95 px-4 py-4 backdrop-blur sm:mx-0 sm:flex-row sm:justify-end sm:rounded-xl sm:border">
        <Button type="button" variant="outline" onClick={reset} disabled={mutation.isPending}>
          <RotateCcw className="h-4 w-4" /> Reset form
        </Button>
        <Button type="submit" disabled={mutation.isPending} size="lg">
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          {mutation.isPending ? "Predicting…" : "Predict grade"}
        </Button>
      </div>
    </form>
  );
}

function ResultPanel({ data, onEdit, onNew }: { data: JsonValue; onEdit: () => void; onNew: () => void }) {
  const p = readPrediction(data);
  const hasScale = p.scaleMax !== undefined && p.scaleMin !== undefined;
  const extras = isObj(data) ? Object.entries(data).filter(([, v]) => v !== p.grade && v !== p.category && v !== p.message) : [];

  return (
    <div className="space-y-6">
      <section className="card-surface overflow-hidden">
        <div className="bg-brand px-6 py-4 text-navy-foreground">
          <p className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4" aria-hidden /> Prediction result</p>
        </div>
        <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-2 md:items-center">
          <div className="flex justify-center">
            {p.grade !== null && hasScale ? (
              <GradeGauge value={p.grade} min={p.scaleMin!} max={p.scaleMax!} />
            ) : p.grade !== null ? (
              <div className="text-center">
                <p className="font-mono text-6xl font-semibold text-foreground">{p.grade.toFixed(2)}</p>
                <p className="mt-2 text-sm text-muted-foreground">Grading scale not reported by the backend.</p>
              </div>
            ) : (
              <p className="text-muted-foreground">The response did not contain a numeric grade. Full response shown below.</p>
            )}
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Predicted final grade</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {p.grade !== null ? p.grade.toFixed(2) : "—"}
                {hasScale && <span className="text-base font-normal text-muted-foreground"> / {p.scaleMax}</span>}
              </p>
            </div>
            {p.category && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Performance category</p>
                <span className="mt-1 inline-block rounded-full bg-accent px-3 py-1 text-sm font-semibold text-accent-foreground">{p.category}</span>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              {p.message ??
                "This is the model's estimate based on the inputs provided, learned from patterns in historical student data. It reflects associations, not causes."}
            </p>
            <p className="rounded-lg bg-warning-soft p-3 text-xs text-foreground">
              Predictions are estimates, not guarantees of future academic results.
            </p>
          </div>
        </div>
      </section>

      {extras.length > 0 && (
        <Panel title="Additional details from the backend">
          <dl className="grid gap-3 sm:grid-cols-2">
            {extras.map(([k, v]) => (
              <div key={k} className="rounded-lg bg-muted p-3">
                <dt className="text-xs font-semibold text-muted-foreground">{prettyKey(k)}</dt>
                <dd className="mt-1 break-words font-mono text-sm text-foreground">{typeof v === "object" ? JSON.stringify(v, null, 1) : String(v)}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button variant="outline" onClick={onEdit}><Pencil className="h-4 w-4" /> Edit inputs</Button>
        <Button onClick={onNew}><RotateCcw className="h-4 w-4" /> Make another prediction</Button>
      </div>
    </div>
  );
}
