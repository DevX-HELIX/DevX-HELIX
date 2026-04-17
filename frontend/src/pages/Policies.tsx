/**
 * Policies.tsx
 * Real policy registry with mode toggle via PATCH /api/policies/:policy_id/mode.
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, RefreshCw, ChevronDown, ChevronRight,
  Shield, AlertTriangle
} from "lucide-react";
import { fetchPolicies, updatePolicyMode } from "@/api/policies";
import type { Policy, PolicyMode, Severity, ArtifactType } from "@/api/contracts";
import { SeverityBadge } from "@/components/common/SeverityBadge";
import { PolicyModeBadge } from "@/components/common/PolicyModeBadge";
import { MetricCard } from "@/components/common/MetricCard";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Confirmation modal ────────────────────────────────────────────────────────

function ConfirmModal({
  policy,
  onConfirm,
  onCancel,
}: {
  policy: Policy;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md mx-4 p-6"
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-full bg-amber-50 border border-amber-200 flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Downgrade to Audit Mode?</h3>
            <p className="text-sm text-slate-600 mt-1">
              Policy <span className="font-mono font-semibold">{policy.policy_id}</span> is currently{" "}
              <strong>enforcing</strong>. Switching to audit mode means violations will no longer block deployments.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700 transition-colors"
          >
            Switch to Audit
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const SEVERITIES: Severity[] = ["Critical", "High", "Medium", "Low"];
const ARTIFACT_TYPES: ArtifactType[] = ["terraform", "kubernetes", "dockerfile"];
const MODES: PolicyMode[] = ["enforce", "audit"];

export default function Policies() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [filterSeverity, setFilterSeverity] = useState<Severity | "">("");
  const [filterMode, setFilterMode] = useState<PolicyMode | "">("");
  const [filterArtifact, setFilterArtifact] = useState<ArtifactType | "">("");

  // Mode toggle state
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [pendingDowngrade, setPendingDowngrade] = useState<Policy | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPolicies();
      setPolicies(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load policies");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleModeToggle = async (policy: Policy) => {
    const newMode: PolicyMode = policy.mode === "enforce" ? "audit" : "enforce";

    // Confirm before downgrading
    if (policy.mode === "enforce" && newMode === "audit") {
      setPendingDowngrade(policy);
      return;
    }
    await doModeUpdate(policy, newMode);
  };

  const doModeUpdate = async (policy: Policy, newMode: PolicyMode) => {
    // Optimistic update
    setPolicies((prev) =>
      prev.map((p) => (p.policy_id === policy.policy_id ? { ...p, mode: newMode } : p))
    );
    setTogglingId(policy.policy_id);
    try {
      const updated = await updatePolicyMode(policy.policy_id, newMode);
      setPolicies((prev) =>
        prev.map((p) => (p.policy_id === updated.policy_id ? updated : p))
      );
      showToast(`${policy.name} → ${newMode} mode`);
    } catch {
      // Rollback
      setPolicies((prev) =>
        prev.map((p) => (p.policy_id === policy.policy_id ? policy : p))
      );
      showToast("Failed to update mode — changes reverted");
    } finally {
      setTogglingId(null);
    }
  };

  const filtered = useMemo(() => {
    return policies.filter((p) => {
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.policy_id.toLowerCase().includes(search.toLowerCase()) ||
        (p.category ?? "").toLowerCase().includes(search.toLowerCase());
      const matchSeverity = !filterSeverity || p.severity === filterSeverity;
      const matchMode = !filterMode || p.mode === filterMode;
      const matchArtifact = !filterArtifact || (p.applies_to ?? []).includes(filterArtifact);
      return matchSearch && matchSeverity && matchMode && matchArtifact;
    });
  }, [policies, search, filterSeverity, filterMode, filterArtifact]);

  const enforceCount = policies.filter((p) => p.mode === "enforce").length;
  const auditCount   = policies.filter((p) => p.mode === "audit").length;
  const criticalCount = policies.filter((p) => p.severity === "Critical").length;

  if (loading) {
    return (
      <div className="flex flex-col gap-6 px-6 py-6 max-w-6xl mx-auto">
        <Skeleton className="h-7 w-48" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
        <Skeleton className="h-[500px] rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 py-6 max-w-6xl mx-auto">
        <ErrorState title="Failed to load policies" message={error} onRetry={load} />
      </div>
    );
  }

  return (
    <>
      {/* Confirmation modal */}
      <AnimatePresence>
        {pendingDowngrade && (
          <ConfirmModal
            policy={pendingDowngrade}
            onConfirm={() => {
              doModeUpdate(pendingDowngrade, "audit");
              setPendingDowngrade(null);
            }}
            onCancel={() => setPendingDowngrade(null)}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-xl"
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col gap-6 px-6 py-6 max-w-6xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Policy Registry</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Source-of-truth policy control panel. Toggle enforce ↔ audit mode to control deployment gates.
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

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="Total Policies" value={policies.length} icon={<Shield className="h-4 w-4" />} />
          <MetricCard label="Enforce Mode" value={enforceCount} accent="blue" />
          <MetricCard label="Audit Mode" value={auditCount} />
          <MetricCard label="Critical Severity" value={criticalCount} accent={criticalCount > 0 ? "red" : "default"} />
        </div>

        {/* Filter row */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-52">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, ID, or category…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            {/* Severity filter */}
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value as Severity | "")}
              className="text-sm border border-slate-200 rounded-md px-3 py-2 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Severities</option>
              {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>

            {/* Mode filter */}
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value as PolicyMode | "")}
              className="text-sm border border-slate-200 rounded-md px-3 py-2 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Modes</option>
              {MODES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>

            {/* Artifact type filter */}
            <select
              value={filterArtifact}
              onChange={(e) => setFilterArtifact(e.target.value as ArtifactType | "")}
              className="text-sm border border-slate-200 rounded-md px-3 py-2 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Artifact Types</option>
              {ARTIFACT_TYPES.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>

            {(search || filterSeverity || filterMode || filterArtifact) && (
              <button
                onClick={() => { setSearch(""); setFilterSeverity(""); setFilterMode(""); setFilterArtifact(""); }}
                className="text-xs font-medium text-red-600 hover:text-red-800 transition-colors"
              >
                Clear filters
              </button>
            )}

            <span className="ml-auto text-xs text-slate-400">
              {filtered.length} of {policies.length} policies
            </span>
          </div>
        </div>

        {/* Policy table */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <EmptyState
              title="No policies match your filters"
              description="Try clearing some filters or searching with a different term."
              icon={<Shield className="h-5 w-5" />}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="w-8 px-4 py-3" />
                    {["Policy ID", "Name", "Category", "Severity", "Applies To", "Mode", "Updated"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Toggle
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((policy) => (
                    <React.Fragment key={policy.policy_id}>
                      <tr
                        onClick={() => setExpandedId(expandedId === policy.policy_id ? null : policy.policy_id)}
                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer group"
                      >
                        <td className="px-4 py-3 text-slate-400">
                          {expandedId === policy.policy_id
                            ? <ChevronDown className="h-4 w-4" />
                            : <ChevronRight className="h-4 w-4" />}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{policy.policy_id}</td>
                        <td className="px-4 py-3 font-medium text-slate-900 max-w-[200px]">{policy.name}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">{policy.category ?? "—"}</td>
                        <td className="px-4 py-3">
                          <SeverityBadge severity={policy.severity} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {(policy.applies_to ?? []).map((t) => (
                              <span key={t} className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                                {t}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <PolicyModeBadge mode={policy.mode} />
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400 font-mono">
                          {policy.last_modified_at
                            ? new Date(policy.last_modified_at).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleModeToggle(policy)}
                            disabled={togglingId === policy.policy_id}
                            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 focus:outline-none ${
                              policy.mode === "enforce"
                                ? "bg-blue-600 border-blue-600"
                                : "bg-slate-200 border-slate-200"
                            } ${togglingId === policy.policy_id ? "opacity-50 cursor-wait" : ""}`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                policy.mode === "enforce" ? "translate-x-4" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </td>
                      </tr>

                      {/* Expanded detail row */}
                      <AnimatePresence>
                        {expandedId === policy.policy_id && (
                          <motion.tr
                            key={`${policy.policy_id}-detail`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            <td colSpan={9} className="px-6 py-5 bg-slate-50 border-b border-slate-200 border-l-4 border-l-blue-400">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {policy.description && (
                                  <div>
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Description</h4>
                                    <p className="text-sm text-slate-700 leading-relaxed">{policy.description}</p>
                                  </div>
                                )}
                                {policy.remediation && (
                                  <div>
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Remediation</h4>
                                    <p className="text-sm text-slate-700 leading-relaxed">{policy.remediation}</p>
                                  </div>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  ))}

                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
