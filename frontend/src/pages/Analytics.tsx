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
    <div className="min-h-screen bg-white text-[#111111] antialiased p-8 max-w-4xl mx-auto font-sans">
      <header className="flex items-center justify-between mb-10 pb-5 border-b border-[#EFEFEF]">
        <div>
          <h1 className="serif-heading text-4xl font-normal tracking-tight text-[#111111]">Telemetry & Metrics</h1>
          <p className="text-xs font-serif italic text-[#666666] mt-1">Real-time system telemetry and agent intelligence metrics</p>
        </div>
        <Link to="/dashboard" className="text-xs font-semibold uppercase tracking-widest text-[#B22222] hover:underline transition-colors">
          Back to chat
        </Link>
      </header>

      {!data ? (
        <div className="flex items-center gap-2 text-xs font-serif italic text-[#999999]">
          <span>Loading telemetry data...</span>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Card 1 */}
          <div className="border border-[#EFEFEF] p-8 bg-white" style={{ borderRadius: "0px" }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#666666]">Total Operations</p>
            <p className="serif-heading text-4xl font-normal text-[#111111] mt-4">{data.total_tool_calls}</p>
            <p className="text-xs font-serif italic text-[#999999] mt-2">Active API & policy tool executions</p>
          </div>

          {/* Card 2 */}
          <div className="border border-[#EFEFEF] p-8 bg-white" style={{ borderRadius: "0px" }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#666666]">Avg Response Time</p>
            <p className="serif-heading text-4xl font-normal text-[#111111] mt-4">{data.avg_latency_ms} <span className="text-xs font-sans font-semibold text-[#666666] uppercase tracking-widest">ms</span></p>
            <p className="text-xs font-serif italic text-[#999999] mt-2">Round-trip tool call latency</p>
          </div>

          {/* Card 3 */}
          <div className="border border-[#EFEFEF] p-8 bg-white md:col-span-1" style={{ borderRadius: "0px" }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#666666] mb-6">Tool Utilization</p>
            {Object.keys(data.tool_usage).length === 0 ? (
              <p className="text-xs text-[#999999] italic py-2 font-serif">No active tool executions logged</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(data.tool_usage).map(([tool, count]) => {
                  const maxCount = Math.max(...Object.values(data.tool_usage) as number[]);
                  const pct = maxCount > 0 ? (count as number / maxCount) * 100 : 0;
                  return (
                    <div key={tool}>
                      <div className="flex justify-between text-xs font-semibold text-[#111111] mb-1 font-sans uppercase tracking-wider text-[10px]">
                        <span className="capitalize">{tool.replace("_", " ")}</span>
                        <span>{count as number}</span>
                      </div>
                      <div className="w-full bg-[#EFEFEF] h-[2px]">
                        <div className="bg-[#B22222] h-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
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
