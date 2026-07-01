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
    <div className="min-h-screen bg-white text-[#111111] antialiased p-8 max-w-4xl mx-auto">
      <header className="flex items-center justify-between mb-10 pb-5 border-b border-[#F1F1F1]">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#111111]">Performance Analytics</h1>
          <p className="text-xs text-[#666666] mt-1">Real-time system telemetry and agent intelligence metrics</p>
        </div>
        <Link to="/dashboard" className="text-sm font-semibold text-[#E53935] hover:text-[#D32F2F] transition-colors">
          Back to chat
        </Link>
      </header>

      {!data ? (
        <div className="flex items-center gap-2 text-xs font-semibold text-[#999999]">
          <div className="w-1.5 h-1.5 rounded-full bg-[#E53935] animate-ping"></div>
          <span>Loading telemetry data...</span>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Card 1 */}
          <div className="border border-[#F1F1F1] rounded-3xl p-6 bg-[#FAFAFA] shadow-soft">
            <p className="text-xs font-bold uppercase tracking-wider text-[#666666]">Total Operations</p>
            <p className="text-4xl font-extrabold tracking-tight text-[#111111] mt-4">{data.total_tool_calls}</p>
            <p className="text-xs text-[#999999] mt-2">Active API & policy tool executions</p>
          </div>

          {/* Card 2 */}
          <div className="border border-[#F1F1F1] rounded-3xl p-6 bg-[#FAFAFA] shadow-soft">
            <p className="text-xs font-bold uppercase tracking-wider text-[#666666]">Avg Response Time</p>
            <p className="text-4xl font-extrabold tracking-tight text-[#111111] mt-4">{data.avg_latency_ms} <span className="text-sm font-semibold text-[#666666]">ms</span></p>
            <p className="text-xs text-[#999999] mt-2">Round-trip tool call latency</p>
          </div>

          {/* Card 3 */}
          <div className="border border-[#F1F1F1] rounded-3xl p-6 bg-[#FAFAFA] shadow-soft md:col-span-1">
            <p className="text-xs font-bold uppercase tracking-wider text-[#666666] mb-4">Tool Utilization</p>
            {Object.keys(data.tool_usage).length === 0 ? (
              <p className="text-xs text-[#999999] italic py-2">No active tool executions logged</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(data.tool_usage).map(([tool, count]) => {
                  const maxCount = Math.max(...Object.values(data.tool_usage) as number[]);
                  const pct = maxCount > 0 ? (count as number / maxCount) * 100 : 0;
                  return (
                    <div key={tool}>
                      <div className="flex justify-between text-xs font-semibold text-[#111111] mb-1">
                        <span className="capitalize">{tool.replace("_", " ")}</span>
                        <span>{count as number}</span>
                      </div>
                      <div className="w-full bg-[#E5E5E5] h-1 rounded-full overflow-hidden">
                        <div className="bg-[#E53935] h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
