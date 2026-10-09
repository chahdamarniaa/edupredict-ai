import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { Panel } from "@/components/states";
import { useEndpoints } from "@/hooks/use-backend";
import { API_BASE_URL } from "@/lib/api";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Student Performance Predictor AI" },
      { name: "description", content: "An educational machine-learning application built with Python, FastAPI, scikit-learn and React." },
      { property: "og:title", content: "About — Student Performance Predictor AI" },
      { property: "og:description", content: "An educational machine-learning application built with Python, FastAPI, scikit-learn and React." },
    ],
  }),
  component: About,
});

const STACK = [
  { name: "Python", role: "Data processing and model training" },
  { name: "pandas", role: "Data loading and feature preparation" },
  { name: "scikit-learn", role: "Regression model and evaluation" },
  { name: "FastAPI", role: "REST API serving predictions" },
  { name: "React + TypeScript", role: "This interactive dashboard" },
  { name: "Tailwind CSS & Recharts", role: "Interface styling and charts" },
];
const FLOW = ["Enter student data", "Validate against API schema", "POST to FastAPI", "scikit-learn model predicts", "Result displayed"];

function About() {
  const ep = useEndpoints();
  return (
    <>
      <PageHeader eyebrow="Project" title="About" subtitle="An educational machine-learning application for estimating student academic performance." />
      <div className="space-y-6">
        <Panel title="Technology stack">
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {STACK.map((s) => (
              <li key={s.name} className="rounded-xl border border-border p-4 transition-colors hover:border-primary/40">
                <p className="font-semibold text-foreground">{s.name}</p>
                <p className="text-sm text-muted-foreground">{s.role}</p>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="From input to prediction">
          <ol className="flex flex-col gap-2 md:flex-row md:items-center md:flex-wrap">
            {FLOW.map((f, i) => (
              <li key={f} className="flex items-center gap-2">
                <span className="rounded-lg bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground">
                  <span className="mr-1.5 font-mono text-primary">{i + 1}</span>
                  {f}
                </span>
                {i < FLOW.length - 1 && <ArrowRight className="hidden h-4 w-4 text-muted-foreground md:block" aria-hidden />}
              </li>
            ))}
          </ol>
        </Panel>
        <Panel title="Connected backend">
          <p className="text-sm text-muted-foreground">
            Base URL: <span className="font-mono text-foreground">{API_BASE_URL}</span>
            {ep.data?.title && <> · {ep.data.title}{ep.data.version && ` v${ep.data.version}`}</>}
          </p>
          {ep.data && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {ep.data.allPaths.map((p) => (
                <li key={p} className="rounded-md bg-muted px-2 py-1 font-mono text-xs text-foreground">{p}</li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
