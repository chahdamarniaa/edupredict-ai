import type { ReactNode } from "react";
import { AlertTriangle, RefreshCw, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiError, type ApiErrorKind } from "@/lib/api";

const KIND_LABEL: Record<ApiErrorKind, string> = {
  network: "Network error",
  cors: "CORS blocked",
  "mixed-content": "Mixed content",
  validation: "Validation error",
  "bad-request": "Bad request",
  "not-found": "Not found",
  "model-unavailable": "Model unavailable",
  server: "Server error",
  http: "HTTP error",
};

export function ErrorState({ error, onRetry, title = "Couldn't load data" }: { error: unknown; onRetry?: () => void; title?: string }) {
  const msg = error instanceof Error ? error.message : "Unexpected error.";
  const status = error instanceof ApiError && error.status ? ` (HTTP ${error.status})` : "";
  const kind = error instanceof ApiError ? KIND_LABEL[error.kind] : undefined;
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border border-destructive/25 bg-destructive/5 p-5">
      <div className="flex flex-wrap items-center gap-2 font-semibold text-destructive">
        <AlertTriangle className="h-4 w-4" aria-hidden /> {title}
        {status}
        {kind && <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium">{kind}</span>}
      </div>
      <p className="text-sm text-foreground/80">{msg}</p>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry}>
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, children, action }: { icon: LucideIcon; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-10 text-center">
      <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <p className="font-semibold text-foreground">{title}</p>
      {children && <div className="mt-1 max-w-sm text-sm text-muted-foreground">{children}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Panel({ title, description, children, actions }: { title: string; description?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="card-surface p-5 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}
