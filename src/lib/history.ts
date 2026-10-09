import type { HistoryEntry } from "@/types/api";

const KEY = "spp-history-v1";

export function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}
export function addHistory(e: HistoryEntry) {
  const list = [e, ...loadHistory()].slice(0, 50);
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("spp-history"));
}
export function clearHistory() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("spp-history"));
}
