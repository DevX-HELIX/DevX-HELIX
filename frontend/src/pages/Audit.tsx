/**
 * Audit.tsx
 * Historical run explorer connected to GET /api/audit.
 * Supports filters, pagination, and row click → RunDetail.
 */

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Filter, X, ChevronRight, ChevronLeft, RefreshCw } from "lucide-react";
import { fetchAuditRuns } from "@/api/audit";
import type { AuditRun, ValidationStatus, ArtifactType } from "@/api/contracts";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 20;

const STATUSES: ValidationStatus[] = ["PASSED", "ADVISORY", "BLOCKED"];
const ARTIFACT_TYPES: ArtifactType[] = ["terraform", "kubernetes", "dockerfile"];

export default function Audit() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Derive filter state from URL
  const [search, setSearch]               = useState(searchParams.get("q") ?? "");
  const [filterStatus, setFilterStatus]   = useState<ValidationStatus | "">(
    (searchParams.get("status") as ValidationStatus | null) ?? ""
  );
  const [filterTeam, setFilterTeam]       = useState(searchParams.get("team") ?? "");
  const [filterEnv, setFilterEnv]         = useState(searchParams.get("env") ?? "");
  const [filterArtifact, setFilterArtifact] = useState<ArtifactType | "">(
    (searchParams.get("artifact") as ArtifactType | null) ?? ""
  );
  const [page, setPage] = useState(Number(searchParams.get("page") ?? 1));

  const [runs, setRuns] = useState<AuditRun[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Sync state → URL params
  const syncParams = useCallback(() => {
    const p: Record<string, string> = {};
    if (search)         p.q        = search;
    if (filterStatus)   p.status   = filterStatus;
    if (filterTeam)     p.team     = filterTeam;
    if (filterEnv)      p.env      = filterEnv;
    if (filterArtifact) p.artifact = filterArtifact;
    if (page > 1)       p.page     = String(page);
    setSearchParams(p, { replace: true });
  }, [search, filterStatus, filterTeam, filterEnv, filterArtifact, page, setSearchParams]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAuditRuns({
        status:        filterStatus || undefined,
        team:          filterTeam   || undefined,
        environment:   filterEnv    || undefined,
        artifact_type: filterArtifact || undefined,
        page,
        limit: PAGE_SIZE,
      });
      setRuns(res.runs);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterTeam, filterEnv, filterArtifact, page]);

  useEffect(() => {
    load();
    syncParams();
  }, [load, syncParams]);

  const resetFilters = () => {
    setSearch(""); setFilterStatus(""); setFilterTeam("");
    setFilterEnv(""); setFilterArtifact(""); setPage(1);
  };

  const hasFilters = !!(search || filterStatus || filterTeam || filterEnv || filterArtifact);

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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Audit Trail</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Historical CI/CD validation run log — {total} total runs.
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

      {/* Filter bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Filter className="h-3.5 w-3.5" />
            Filters
          </div>

          {/* Search by run ID / commit */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Run ID or commit…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-8 pr-3 py-1.5 text-xs font-mono border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
            />
          </div>

          {/* Status */}
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value as ValidationStatus | ""); setPage(1); }}
            className="text-xs border border-slate-200 rounded-md px-2 py-1.5 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Team */}
          <input
            type="text"
            placeholder="Team"
            value={filterTeam}
            onChange={(e) => { setFilterTeam(e.target.value); setPage(1); }}
            className="w-28 text-xs border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Environment */}
          <input
            type="text"
            placeholder="Environment"
            value={filterEnv}
            onChange={(e) => { setFilterEnv(e.target.value); setPage(1); }}
            className="w-32 text-xs border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Artifact type */}
          <select
            value={filterArtifact}
            onChange={(e) => { setFilterArtifact(e.target.value as ArtifactType | ""); setPage(1); }}
            className="text-xs border border-slate-200 rounded-md px-2 py-1.5 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Artifact Types</option>
            {ARTIFACT_TYPES.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>

          {hasFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-800 transition-colors"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          )}
        </div>

        {/* Active filter chips */}
        {hasFilters && (
          <div className="flex flex-wrap gap-2 mt-3">
            {search && (
              <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-0.5 font-mono">
                q: {search}
                <button onClick={() => setSearch("")}><X className="h-3 w-3" /></button>
              </span>
            )}
            {filterStatus && (
              <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-0.5">
                status: {filterStatus}
                <button onClick={() => setFilterStatus("")}><X className="h-3 w-3" /></button>
              </span>
            )}
            {filterTeam && (
              <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-0.5">
                team: {filterTeam}
                <button onClick={() => setFilterTeam("")}><X className="h-3 w-3" /></button>
              </span>
            )}
            {filterEnv && (
              <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-0.5">
                env: {filterEnv}
                <button onClick={() => setFilterEnv("")}><X className="h-3 w-3" /></button>
              </span>
            )}
            {filterArtifact && (
              <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-0.5">
                type: {filterArtifact}
                <button onClick={() => setFilterArtifact("")}><X className="h-3 w-3" /></button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-12 rounded" />)}
          </div>
        ) : error ? (
          <ErrorState title="Failed to load audit logs" message={error} onRetry={load} />
        ) : runs.length === 0 ? (
          <EmptyState
            title="No runs found"
            description={hasFilters ? "Try clearing some filters." : "Run your first validation to see it here."}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {["Run ID", "Timestamp", "Team", "Environment", "Artifact", "Commit", "Triggered By", "Status", "Block", "Adv"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => (
                    <tr
                      key={run.run_id}
                      onClick={() => navigate(`/run/${run.run_id}`)}
                      className="border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-slate-500 group-hover:text-blue-600 transition-colors whitespace-nowrap">
                        {run.run_id.slice(0, 8)}…
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                        {new Date(run.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-700">{run.team ?? "—"}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{run.environment ?? "—"}</td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-500">{run.artifact_type ?? "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500 max-w-[100px] truncate">
                        {run.commit_sha ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 max-w-[140px] truncate">
                        {run.triggered_by ?? "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={run.status} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-bold ${(run.counts?.blocking ?? 0) > 0 ? "text-red-600" : "text-slate-300"}`}>
                          {run.counts?.blocking ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-bold ${(run.counts?.advisory ?? 0) > 0 ? "text-amber-600" : "text-slate-300"}`}>
                          {run.counts?.advisory ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50">
              <span className="text-xs text-slate-500">
                Page {page} of {totalPages} — {total} total runs
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-3 w-3" /> Prev
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
