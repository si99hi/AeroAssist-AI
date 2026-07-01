import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { analyticsApi } from "../services/api";
import type { Analytics } from "../types";

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    analyticsApi.get().then(setData).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen p-6 max-w-3xl mx-auto">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-semibold">Analytics</h1>
        <Link to="/dashboard" className="text-sm text-accent">
          Back to chat
        </Link>
      </header>

      {!data ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="border border-border rounded-xl p-6 bg-panel">
            <p className="text-gray-400 text-sm">Total tool calls</p>
            <p className="text-3xl font-semibold mt-1">{data.total_tool_calls}</p>
          </div>
          <div className="border border-border rounded-xl p-6 bg-panel">
            <p className="text-gray-400 text-sm">Avg latency</p>
            <p className="text-3xl font-semibold mt-1">{data.avg_latency_ms} ms</p>
          </div>
          <div className="border border-border rounded-xl p-6 bg-panel md:col-span-1">
            <p className="text-gray-400 text-sm mb-3">Tool usage</p>
            {Object.keys(data.tool_usage).length === 0 ? (
              <p className="text-gray-500 text-sm">No data yet</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {Object.entries(data.tool_usage).map(([tool, count]) => (
                  <li key={tool} className="flex justify-between">
                    <span>{tool}</span>
                    <span className="text-gray-400">{count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
