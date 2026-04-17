/**
 * RunDetail.tsx
 * Single run detail view from GET /api/audit/:run_id.
 */

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Copy, Check, Download,
  RotateCcw, Hash, GitCommit, User, Server, Package
} from "lucide-react";
import { fetchRunDetail } from "@/api/audit";
import type { AuditRunDetail } from "@/api/contracts";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ViolationRow } from "@/components/common/ViolationRow";
import { JsonAccordion } from "@/components/common/JsonAccordion";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";

type TabId = "summary" | "violations" | "json";

export default function RunDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [run, setRun] = useState<AuditRunDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("summary");
  const [copiedId, setCopiedId] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRunDetail(id);
      setRun(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Run not found");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const copyText = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const downloadJson = () => {
    if (!run) return;
    const blob = new Blob([JSON.stringify(run, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `run-${id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="px-6 py-6 max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
        <Skeleton className="h-[500px] rounded-lg" />
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="px-6 py-6 max-w-5xl mx-auto">
        <button onClick={() => navigate("/audit")} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Audit Trail
        </button>
        <ErrorState title="Run not found" message={error ?? "This run ID does not exist."} onRetry={load} />
      </div>
    );
  }

  const blockingCount = run.violations?.filter((v) => v.mode === "enforce").length ?? 0;
  const advisoryCount = run.violations?.filter((v) => v.mode === "audit").length ?? 0;

  const TABS: { id: TabId; label: string; count?: number }[] = [
    { id: "summary",    label: "Summary" },
    { id: "violations", label: "Violations", count: run.violations?.length ?? 0 },
    { id: "json",       label: "Raw JSON" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col gap-6 px-6 py-6 max-w-5xl mx-auto"
    >
      {/* Back + header */}
      <div>
        <button
          onClick={() => navigate("/audit")}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Audit Trail
        </button>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xl">{run.run_id.slice(0, 8)}</span>
              <span className="font-mono text-slate-400 text-base">…{run.run_id.slice(-8)}</span>
              <StatusBadge status={run.status} size="md" />
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {new Date(run.timestamp).toLocaleString()} · triggered by{" "}
              <span className="font-mono text-slate-700">{run.triggered_by ?? "unknown"}</span>
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => copyText(run.run_id, setCopiedId)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
            >
              {copiedId ? <><Check className="h-3 w-3 text-emerald-500" /> Copied</> : <><Copy className="h-3 w-3" /> Copy Run ID</>}
            </button>
            {run.commit_sha && (
              <button
                onClick={() => copyText(run.commit_sha, setCopiedHash)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
              >
                {copiedHash ? <><Check className="h-3 w-3 text-emerald-500" /> Copied</> : <><GitCommit className="h-3 w-3" /> Copy SHA</>}
              </button>
            )}
            <button
              onClick={downloadJson}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Download className="h-3 w-3" /> Download JSON
            </button>
            <button
              onClick={() => navigate("/validate")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
            >
              <RotateCcw className="h-3 w-3" /> Re-run Validation
            </button>
          </div>
        </div>
      </div>

      {/* Violation summary strip */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm text-center">
          <div className="text-2xl font-bold text-slate-900">{run.violations?.length ?? 0}</div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Total Violations</div>
        </div>
        <div className={`rounded-lg p-4 shadow-sm text-center border ${blockingCount > 0 ? "bg-red-50 border-red-200" : "bg-white border-slate-200"}`}>
          <div className={`text-2xl font-bold ${blockingCount > 0 ? "text-red-700" : "text-slate-400"}`}>{blockingCount}</div>
          <div className={`text-xs font-semibold uppercase tracking-wider mt-1 ${blockingCount > 0 ? "text-red-600" : "text-slate-400"}`}>Blocking</div>
        </div>
        <div className={`rounded-lg p-4 shadow-sm text-center border ${advisoryCount > 0 ? "bg-amber-50 border-amber-200" : "bg-white border-slate-200"}`}>
          <div className={`text-2xl font-bold ${advisoryCount > 0 ? "text-amber-700" : "text-slate-400"}`}>{advisoryCount}</div>
          <div className={`text-xs font-semibold uppercase tracking-wider mt-1 ${advisoryCount > 0 ? "text-amber-600" : "text-slate-400"}`}>Advisory</div>
        </div>
      </div>

      {/* Metadata cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: User,      label: "Team",          value: run.team },
          { icon: Server,    label: "Environment",   value: run.environment },
          { icon: Package,   label: "Artifact Type", value: run.artifact_type },
          { icon: Hash,      label: "Commit SHA",    value: run.commit_sha, mono: true },
        ].map(({ icon: Icon, label, value, mono }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Icon className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
            </div>
            <span className={`text-sm font-medium text-slate-800 block truncate ${mono ? "font-mono text-xs" : ""}`}>
              {value ?? "—"}
            </span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors ${
                activeTab === tab.id
                  ? "text-blue-700 border-b-2 border-blue-600 bg-blue-50/40"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={`ml-1 px-1.5 py-0.5 text-xs font-bold rounded-full ${
                  activeTab === tab.id ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* Summary tab */}
          {activeTab === "summary" && (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg border ${
                run.status === "BLOCKED"   ? "bg-red-50 border-red-200 text-red-800" :
                run.status === "ADVISORY"  ? "bg-amber-50 border-amber-200 text-amber-800" :
                "bg-emerald-50 border-emerald-200 text-emerald-800"
              }`}>
                <p className="text-sm font-semibold">
                  {run.status === "BLOCKED"
                    ? "❌ Deployment was blocked by enforced policy violations."
                    : run.status === "ADVISORY"
                    ? "⚠️ Deployment was allowed with advisory violations."
                    : "✅ All enforced policy checks passed."}
                </p>
              </div>

              <div className="text-sm text-slate-600 space-y-2">
                <p>
                  <strong className="text-slate-800">Run ID:</strong>{" "}
                  <span className="font-mono">{run.run_id}</span>
                </p>
                <p>
                  <strong className="text-slate-800">Timestamp:</strong>{" "}
                  {new Date(run.timestamp).toLocaleString()}
                </p>
                <p>
                  <strong className="text-slate-800">Triggered by:</strong>{" "}
                  <span className="font-mono">{run.triggered_by ?? "unknown"}</span>
                </p>
                <p>
                  <strong className="text-slate-800">Team / Env:</strong>{" "}
                  {run.team ?? "—"} / {run.environment ?? "—"}
                </p>
              </div>
            </div>
          )}

          {/* Violations tab */}
          {activeTab === "violations" && (
            run.violations?.length === 0 ? (
              <EmptyState title="No violations" description="This run passed all active policies." />
            ) : (
              <div className="space-y-3">
                {run.violations?.map((v, i) => (
                  <ViolationRow key={`${v.policy_id}-${i}`} violation={v} index={i} />
                ))}
              </div>
            )
          )}

          {/* Raw JSON tab */}
          {activeTab === "json" && (
            <JsonAccordion label="Full Run Document" data={run} defaultOpen />
          )}
        </div>
      </div>
    </motion.div>
  );
}
