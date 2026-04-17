/**
 * Dashboard.tsx
 * Compliance overview with real data from GET /api/dashboard/stats.
 */

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import {
  CheckCircle2, ShieldAlert, Activity, AlertTriangle,
  RefreshCw, ArrowRight, ExternalLink
} from "lucide-react";
import { fetchDashboardStats } from "@/api/dashboard";
import type { DashboardStats } from "@/api/contracts";
import { MetricCard } from "@/components/common/MetricCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_COLORS = {
  PASSED:   "#10b981",
  ADVISORY: "#f59e0b",
  BLOCKED:  "#ef4444",
};

const PIE_COLORS = ["#10b981", "#f59e0b", "#ef4444"];

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const stats = await fetchDashboardStats();
      setData(stats);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 px-6 py-6 max-w-6xl mx-auto">
        <Skeleton className="h-7 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="col-span-2 h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 py-6 max-w-6xl mx-auto">
        <ErrorState title="Failed to load dashboard" message={error} onRetry={load} />
      </div>
    );
  }

  if (!data) return null;

  const isFirstRun = data.total_runs === 0;
  const passedCount = data.total_runs - data.blocked_count - data.advisory_count;

  const pieData = isFirstRun
    ? [{ name: "No data", value: 1 }]
    : [
        { name: "Passed",   value: passedCount },
        { name: "Advisory", value: data.advisory_count },
        { name: "Blocked",  value: data.blocked_count },
      ].filter((d) => d.value > 0);

  const barData = (data.top_violations ?? []).map((v) => ({
    name: (v.policy_name ?? "Unknown").substring(0, 22),
    count: v.count,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col gap-6 px-6 py-6 max-w-6xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Compliance Overview</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Policy-as-Code governance metrics across all validation runs.
            {lastUpdated && (
              <span className="ml-2 text-slate-400">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors shadow-sm"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {/* KPI metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Compliance Score"
          value={`${data.compliance_score.toFixed(1)}%`}
          icon={<CheckCircle2 className="h-4 w-4" />}
          accent={data.compliance_score >= 90 ? "green" : data.compliance_score >= 70 ? "amber" : "red"}
        />
        <MetricCard
          label="Total Runs"
          value={data.total_runs}
          icon={<Activity className="h-4 w-4" />}
          sub="all time"
          accent="blue"
        />
        <MetricCard
          label="Blocked"
          value={data.blocked_count}
          icon={<ShieldAlert className="h-4 w-4" />}
          sub="deployment blocked"
          accent={data.blocked_count > 0 ? "red" : "green"}
        />
        <MetricCard
          label="Advisory"
          value={data.advisory_count}
          icon={<AlertTriangle className="h-4 w-4" />}
          sub="allowed with warnings"
          accent={data.advisory_count > 0 ? "amber" : "green"}
        />
      </div>

      {isFirstRun ? (
        <EmptyState
          title="No validation runs yet"
          description="Run your first validation to see compliance data here."
          action={
            <button
              onClick={() => navigate("/validate")}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              Run First Validation <ArrowRight className="h-4 w-4" />
            </button>
          }
        />
      ) : (
        <>
          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent run status pie */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-700 mb-1">Run Status Distribution</h2>
              <p className="text-xs text-slate-400 mb-4">All {data.total_runs} runs</p>
              <div className="flex items-center gap-4">
                <div className="h-36 w-36 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={42}
                        outerRadius={60}
                        startAngle={90}
                        endAngle={-270}
                        stroke="none"
                        dataKey="value"
                      >
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {[
                    { label: "Passed",   count: passedCount,           color: "bg-emerald-500" },
                    { label: "Advisory", count: data.advisory_count,   color: "bg-amber-500" },
                    { label: "Blocked",  count: data.blocked_count,    color: "bg-red-500" },
                  ].map(({ label, count, color }) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${color}`} />
                      <span className="text-xs text-slate-600">{label}</span>
                      <span className="text-xs font-semibold text-slate-800 ml-auto">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top violated policies bar */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-700 mb-1">Top Violated Policies</h2>
              <p className="text-xs text-slate-400 mb-4">By violation count across all runs</p>
              {barData.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-sm text-slate-400">
                  No violations recorded.
                </div>
              ) : (
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} layout="vertical" margin={{ left: 4, right: 16, top: 0, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={160}
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: "#f8fafc" }}
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          borderColor: "#e2e8f0",
                          borderRadius: "6px",
                          fontSize: "12px",
                        }}
                      />
                      <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={14} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Recent runs table */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-700">Recent Runs</h2>
              <button
                onClick={() => navigate("/audit")}
                className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
              >
                View all <ExternalLink className="h-3 w-3" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {["Run ID", "Team", "Environment", "Artifact", "Status", "Blocking", "Advisory"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.recent_runs.map((run) => (
                    <tr
                      key={run.run_id}
                      onClick={() => navigate(`/run/${run.run_id}`)}
                      className="border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-slate-500 group-hover:text-blue-600 transition-colors">
                        {run.run_id.slice(0, 8)}…
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-700">{run.team ?? "—"}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{run.environment ?? "—"}</td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-500">{run.artifact_type ?? "—"}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={run.status} />
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold ${run.counts?.blocking > 0 ? "text-red-600" : "text-slate-400"}`}>
                          {run.counts?.blocking ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold ${run.counts?.advisory > 0 ? "text-amber-600" : "text-slate-400"}`}>
                          {run.counts?.advisory ?? 0}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.recent_runs.length === 0 && (
                <p className="text-center text-sm text-slate-400 py-8">No recent runs.</p>
              )}
            </div>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Run Validation", desc: "Submit infrastructure code for policy evaluation", href: "/validate", color: "text-blue-600" },
              { label: "Manage Policies", desc: "View and toggle policy modes", href: "/policies", color: "text-slate-700" },
              { label: "Audit Trail", desc: "Explore historical validation runs", href: "/audit", color: "text-slate-700" },
            ].map(({ label, desc, href, color }) => (
              <button
                key={label}
                onClick={() => navigate(href)}
                className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg hover:border-slate-300 hover:shadow-sm transition-all group text-left"
              >
                <div>
                  <p className={`text-sm font-semibold ${color}`}>{label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
              </button>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}
