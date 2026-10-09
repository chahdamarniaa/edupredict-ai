import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useMetrics } from "@/hooks/use-backend";
import { ErrorState, EmptyState } from "@/components/states";
import { METRIC_INFO, fmt, metricGroups, metricKind, prettyKey } from "@/lib/interpret";

export function MetricCard({ label, full, value, hint }: { label: string; full?: string; value: number; hint?: string }) {
  return (
    <div className="card-surface p-5 transition-shadow hover:shadow-lift">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 font-mono text-3xl font-semibold text-primary">{fmt(value)}</p>
      {full && <p className="mt-1 text-sm font-medium text-foreground">{full}</p>}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function MetricsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-32 rounded-xl" />
      ))}
    </div>
  );
}

/** Renders real metrics from the backend, grouped as the backend groups them. */
export function MetricsView({ showChart = false }: { showChart?: boolean }) {
  const { endpoints, query } = useMetrics();
  if (endpoints.isLoading || query.isLoading) return <MetricsSkeleton />;
  if (endpoints.error) return <ErrorState error={endpoints.error} onRetry={() => endpoints.refetch()} title="Backend unavailable" />;
  if (!endpoints.data?.metrics)
    return (
      <EmptyState icon={BarChart3} title="Metrics endpoint not available">
        The backend does not expose a model metrics route, so no evaluation figures are shown.
      </EmptyState>
    );
  if (query.error) return <ErrorState error={query.error} onRetry={() => query.refetch()} title="Couldn't load metrics" />;
  const groups = metricGroups(query.data ?? null);
  if (!groups.length)
    return (
      <EmptyState icon={BarChart3} title="No numeric metrics returned">
        The metrics endpoint responded but contained no numeric values.
      </EmptyState>
    );

  const kinds = ["mae", "rmse", "r2"] as const;
  const comparable = groups.filter((g) => Object.keys(g.values).some((k) => metricKind(k)));
  const chartData = kinds
    .map((kind) => {
      const row: Record<string, string | number> = { metric: METRIC_INFO[kind].name };
      comparable.forEach((g) => {
        const k = Object.keys(g.values).find((x) => metricKind(x) === kind);
        if (k) row[g.name] = g.values[k];
      });
      return row;
    })
    .filter((r) => Object.keys(r).length > 1);
  const colors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];

  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <div key={g.name}>
          {groups.length > 1 && <h3 className="mb-3 text-sm font-semibold text-foreground">{prettyKey(g.name)}</h3>}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(g.values).map(([k, v]) => {
              const kind = metricKind(k);
              const info = kind ? METRIC_INFO[kind] : undefined;
              return <MetricCard key={k} label={info?.name ?? prettyKey(k)} full={info?.full} value={v} hint={info?.text} />;
            })}
          </div>
        </div>
      ))}
      {showChart && comparable.length > 1 && chartData.length > 0 && (
        <div className="card-surface p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Model configuration comparison</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="metric" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid var(--border)" }} />
                <Legend />
                {comparable.map((g, i) => (
                  <Bar key={g.name} dataKey={g.name} name={prettyKey(g.name)} fill={colors[i % colors.length]} radius={[6, 6, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

export function MetricExplainers() {
  return (
    <dl className="grid gap-4 sm:grid-cols-3">
      {(["mae", "rmse", "r2"] as const).map((k) => (
        <div key={k} className="rounded-xl bg-muted p-4">
          <dt className="font-semibold text-foreground">
            {METRIC_INFO[k].name} <span className="font-normal text-muted-foreground">· {METRIC_INFO[k].full}</span>
          </dt>
          <dd className="mt-1 text-sm text-muted-foreground">{METRIC_INFO[k].text}</dd>
        </div>
      ))}
    </dl>
  );
}
