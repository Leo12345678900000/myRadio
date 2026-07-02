"use client";

import React, { useEffect, useState } from "react";
import { getLocalStats, resetLocalStats, LocalStats } from "@shared/services/storage-service/local-stats";

export default function LocalStatsPanel() {
  const [stats, setStats] = useState<LocalStats>(getLocalStats());

  useEffect(() => {
    const timer = setInterval(() => {
      setStats(getLocalStats());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleReset = () => {
    resetLocalStats();
    setStats(getLocalStats());
  };

  return (
    <div className="space-y-3 pt-3 border-t border-neutral-800">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-neutral-400">本地统计看板</label>
        <button
          onClick={handleReset}
          className="text-[10px] px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
        >
          重置
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-neutral-900/70 border border-neutral-800 p-2">
          <p className="text-[10px] text-neutral-500">API Calls</p>
          <p className="text-sm font-mono text-white">{stats.apiCallsTotal}</p>
        </div>
        <div className="rounded-lg bg-neutral-900/70 border border-neutral-800 p-2">
          <p className="text-[10px] text-neutral-500">Success</p>
          <p className="text-sm font-mono text-emerald-300">{stats.apiCallsSuccess}</p>
        </div>
        <div className="rounded-lg bg-neutral-900/70 border border-neutral-800 p-2">
          <p className="text-[10px] text-neutral-500">Failed</p>
          <p className="text-sm font-mono text-red-300">{stats.apiCallsFailed}</p>
        </div>
      </div>
    </div>
  );
}
