import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { discover, type OpenApiSpec } from "@/lib/openapi";
import { loadHistory } from "@/lib/history";
import type { HistoryEntry, JsonValue } from "@/types/api";

export function useEndpoints() {
  return useQuery({
    queryKey: ["openapi"],
    queryFn: async () => discover(await apiGet<OpenApiSpec>("/openapi.json")),
    retry: 1,
    staleTime: 5 * 60_000,
  });
}

function useOptionalGet(key: string, path: string | undefined, enabled: boolean, refetchInterval?: number) {
  return useQuery({
    queryKey: [key, path],
    queryFn: () => apiGet<JsonValue>(path!),
    enabled: enabled && !!path,
    retry: 1,
    refetchInterval,
  });
}

export function useHealth() {
  const ep = useEndpoints();
  const q = useOptionalGet("health", ep.data?.health, ep.isSuccess, 30_000);
  return { endpoints: ep, ...q, isLoading: ep.isLoading || q.isLoading, error: ep.error ?? q.error };
}
export function useMetrics() {
  const ep = useEndpoints();
  return { endpoints: ep, query: useOptionalGet("metrics", ep.data?.metrics, ep.isSuccess) };
}
export function useAnalytics() {
  const ep = useEndpoints();
  return useOptionalGet("analytics", ep.data?.analytics, ep.isSuccess);
}
export function useFeatureSchema() {
  const ep = useEndpoints();
  return useOptionalGet("features", ep.data?.featureSchema, ep.isSuccess);
}

export function useHistory() {
  const [list, setList] = useState<HistoryEntry[]>([]);
  useEffect(() => {
    const sync = () => setList(loadHistory());
    sync();
    window.addEventListener("spp-history", sync);
    return () => window.removeEventListener("spp-history", sync);
  }, []);
  return list;
}
