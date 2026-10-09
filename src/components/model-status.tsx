import { useHealth } from "@/hooks/use-backend";
import { healthState } from "@/lib/interpret";
import { API_BASE_URL } from "@/lib/api";
import { cn } from "@/lib/utils";

const LABELS = {
  online: { text: "Model ready", dot: "bg-success" },
  "not-ready": { text: "Model not ready", dot: "bg-warning" },
  offline: { text: "Backend unreachable", dot: "bg-destructive" },
  unknown: { text: "Checking…", dot: "bg-muted-foreground animate-pulse" },
};

export function useModelState() {
  const h = useHealth();
  const noHealthRoute = h.endpoints.isSuccess && !h.endpoints.data.health;
  const state = noHealthRoute ? "online" : healthState(h.data, h.error);
  return { ...h, state: h.isLoading ? ("unknown" as const) : state, noHealthRoute };
}

export function ModelStatus({ variant = "default" }: { variant?: "default" | "sidebar" }) {
  const { state } = useModelState();
  const l = LABELS[state];
  return (
    <div className="space-y-1" role="status" aria-live="polite">
      <div className="flex items-center gap-2">
        <span className={cn("h-2.5 w-2.5 rounded-full", l.dot)} aria-hidden />
        <span className={cn("text-sm font-medium", variant === "sidebar" ? "text-sidebar-accent-foreground" : "text-foreground")}>{l.text}</span>
      </div>
      <p className={cn("truncate font-mono text-xs", variant === "sidebar" ? "text-sidebar-foreground" : "text-muted-foreground")} title={API_BASE_URL}>
        {API_BASE_URL}
      </p>
    </div>
  );
}
