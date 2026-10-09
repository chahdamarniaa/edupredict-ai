import { createFileRoute } from "@tanstack/react-router";
import { BrainCircuit, Database } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { Panel, EmptyState, ErrorState } from "@/components/states";
import { MetricsView, MetricExplainers } from "@/components/metrics";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalytics, useEndpoints, useHealth, useMetrics } from "@/hooks/use-backend";
import { findKey, isObj, modelType, prettyKey } from "@/lib/interpret";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Model Insights — Student Performance Predictor AI" },
      { name: "description", content: "How the grade prediction model works and how well it performs on real evaluation data." },
      { property: "og:title", content: "Model Insights — Student Performance Predictor AI" },
      { property: "og:description", content: "How the grade prediction model works and how well it performs on real evaluation data." },
    ],
  }),
  component: Insights,
});

function Insights() {
  const ep = useEndpoints();
  const health = useHealth();
  const { query: metrics } = useMetrics();
  const analytics = useAnalytics();
  const mType = modelType(metrics.data, health.data, analytics.data);
  const size = findKey(metrics.data ?? analytics.data, /n_?samples|dataset_?size|rows|records|num_?students|train_?size|test_?size/i, (v) => typeof v === "number");

  return (
    <>
      <PageHeader eyebrow="Model" title="Model Insights" subtitle="How the predictor works, and how well it performs — using only figures reported by the backend." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Purpose">
          <p className="text-sm leading-relaxed text-muted-foreground">
            The predictor helps teachers and students anticipate a final grade early, so support can be offered in time. It is a decision aid, not a verdict.
          </p>
        </Panel>
        <Panel title="Supervised learning & regression">
          <p className="text-sm leading-relaxed text-muted-foreground">
            The model learned from historical student records where the final grade was already known (supervised learning). Because the target is a number,
            it is a <span className="font-medium text-foreground">regression</span> task: the model outputs a continuous grade estimate.
          </p>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div className="card-surface flex items-center gap-4 p-5">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground"><BrainCircuit className="h-5 w-5" aria-hidden /></span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Model type</p>
            {metrics.isLoading || health.isLoading ? <Skeleton className="mt-1 h-5 w-32" /> : <p className="font-semibold text-foreground">{mType ?? "Not reported by backend"}</p>}
          </div>
        </div>
        <div className="card-surface flex items-center gap-4 p-5">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground"><Database className="h-5 w-5" aria-hidden /></span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{size ? prettyKey(size[0]) : "Dataset size"}</p>
            <p className="font-semibold text-foreground">{size ? String(size[1]) : "Not reported by backend"}</p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Panel title="Evaluation metrics" description="If the backend reports several configurations (e.g. with vs. without prior grades), they are compared below.">
          <MetricsView showChart />
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="Understanding the metrics">
          <MetricExplainers />
          <p className="mt-4 text-sm text-muted-foreground">
            Prediction accuracy depends on the quality of the inputs and on how representative the training data is. Models that use earlier grades (G1, G2)
            typically perform far better than those that do not.
          </p>
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="Analytics summary">
          {!ep.data?.analytics ? (
            <EmptyState icon={Database} title="No analytics endpoint">The backend does not expose an analytics summary, so none is shown.</EmptyState>
          ) : analytics.isLoading ? (
            <Skeleton className="h-32 rounded-xl" />
          ) : analytics.error ? (
            <ErrorState error={analytics.error} onRetry={() => analytics.refetch()} />
          ) : isObj(analytics.data) ? (
            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(analytics.data).map(([k, v]) => (
                <div key={k} className="rounded-lg bg-muted p-3">
                  <dt className="text-xs font-semibold text-muted-foreground">{prettyKey(k)}</dt>
                  <dd className="mt-1 break-words font-mono text-sm text-foreground">{typeof v === "object" ? JSON.stringify(v) : String(v)}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <pre className="overflow-auto rounded-lg bg-muted p-3 text-xs">{JSON.stringify(analytics.data, null, 2)}</pre>
          )}
        </Panel>
      </div>
    </>
  );
}
