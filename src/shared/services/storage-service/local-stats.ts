const LOCAL_STATS_KEY = "aetherwave_local_stats";

export interface LocalStats {
  apiCallsTotal: number;
  apiCallsSuccess: number;
  apiCallsFailed: number;
  lastUpdatedAt: number;
}

const DEFAULT_STATS: LocalStats = {
  apiCallsTotal: 0,
  apiCallsSuccess: 0,
  apiCallsFailed: 0,
  lastUpdatedAt: 0,
};

export function getLocalStats(): LocalStats {
  if (typeof window === "undefined") return DEFAULT_STATS;
  try {
    const stored = localStorage.getItem(LOCAL_STATS_KEY);
    if (!stored) return DEFAULT_STATS;
    const parsed = JSON.parse(stored) as Partial<LocalStats>;
    return {
      apiCallsTotal: parsed.apiCallsTotal ?? 0,
      apiCallsSuccess: parsed.apiCallsSuccess ?? 0,
      apiCallsFailed: parsed.apiCallsFailed ?? 0,
      lastUpdatedAt: parsed.lastUpdatedAt ?? 0,
    };
  } catch {
    return DEFAULT_STATS;
  }
}

function saveLocalStats(stats: LocalStats): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_STATS_KEY, JSON.stringify(stats));
}

export function recordApiCallResult(success: boolean): void {
  const current = getLocalStats();
  const next: LocalStats = {
    apiCallsTotal: current.apiCallsTotal + 1,
    apiCallsSuccess: current.apiCallsSuccess + (success ? 1 : 0),
    apiCallsFailed: current.apiCallsFailed + (success ? 0 : 1),
    lastUpdatedAt: Date.now(),
  };
  saveLocalStats(next);
}

export function resetLocalStats(): void {
  saveLocalStats({ ...DEFAULT_STATS, lastUpdatedAt: Date.now() });
}
