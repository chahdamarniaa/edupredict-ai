import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Activity, History, Trash2 } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";

import { Panel, EmptyState, ErrorState } from "@/components/states";
import { MetricsView, MetricExplainers } from "@/components/metrics";
import { ModelStatus, useModelState } from "@/components/model-status";
import { useHistory } from "@/hooks/use-backend";
import { clearHistory } from "@/lib/history";
import { modelType } from "@/lib/interpret";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Student Performance Predictor AI" },
      { name: "description", content: "Model status, evaluation metrics and recent grade predictions at a glance." },
      { property: "og:title", content: "Dashboard — Student Performance Predictor AI" },
      { property: "og:description", content: "Model status, evaluation metrics and recent grade predictions at a glance." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const health = useModelState();
  const history = useHistory();
  const chart = [...history].reverse().filter((h) => h.grade !== null).map((h, i) => ({ n: i + 1, grade: h.grade }));
  const mType = modelType(health.data);

  return (
    <>
      <section className="bg-brand mb-8 overflow-hidden rounded-2xl p-6 text-navy-foreground shadow-lift sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-wider opacity-80">AI academic analytics</p>
        <h1 className="mt-2 max-w-2xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">Student Performance Dashboard</h1>
        <p className="mt-3 max-w-xl opacity-85">
          Estimate a student's final grade with a trained machine-learning model and understand how reliable those estimates are.
        </p>
        <Button asChild size="lg" variant="secondary" className="mt-6">
          <Link to="/predict">
            Predict Student Performance <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Model status" description="Live check against the backend.">
          <ModelStatus />
          {mType && <p className="mt-4 text-sm text-muted-foreground">Model: <span className="font-medium text-foreground">{mType}</span></p>}
          {health.noHealthRoute && <p className="mt-3 text-xs text-muted-foreground">No health route exposed; status inferred from API availability.</p>}
          {health.error && (
            <div className="mt-4">
              <ErrorState error={health.error} onRetry={() => { health.endpoints.refetch(); health.refetch(); }} title="Connection problem" />
            </div>
          )}
        </Panel>
        <div className="lg:col-span-2">
          <Panel title="Model evaluation" description="Metrics reported by the backend on held-out data.">
            <MetricsView />
          </Panel>
        </div>
      </div>

      <div className="mt-6">
        <Panel title="What the metrics mean">
          <MetricExplainers />
        </Panel>
      </div>

      <div className="mt-6">
        <Panel
          title="Prediction history"
          description="Predictions made from this browser (stored locally on this device)."
          actions={
            history.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearHistory}>
                <Trash2 className="h-4 w-4" /> Clear
              </Button>
            )
          }
        >
          {history.length === 0 ? (
            <EmptyState icon={History} title="No predictions yet" action={<Button asChild><Link to="/predict">Make a prediction</Link></Button>}>
              Your predictions will appear here once you run one.
            </EmptyState>
          ) : (
            <div className="space-y-6">
              {chart.length > 1 && (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="n" stroke="var(--muted-foreground)" fontSize={12} />
                      <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                      <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid var(--border)" }} />
                      <Line type="monotone" dataKey="grade" stroke="var(--chart-1)" strokeWidth={2.5} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
              <ul className="divide-y divide-border">
                {history.slice(0, 8).map((h) => (
                  <li key={h.id} className="flex items-center justify-between py-3 text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Activity className="h-4 w-4 text-primary" aria-hidden />
                      {new Date(h.at).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-3">
                      {h.category && <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">{h.category}</span>}
                      <span className="font-mono font-semibold text-foreground">{h.grade !== null ? h.grade.toFixed(2) : "—"}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}

