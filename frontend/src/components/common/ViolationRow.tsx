import { useState } from "react";
import { ChevronDown, ChevronRight, ShieldAlert, AlertTriangle } from "lucide-react";
import { SeverityBadge } from "./SeverityBadge";
import { PolicyModeBadge } from "./PolicyModeBadge";
import { CodeViewer } from "./CodeViewer";
import type { Violation } from "@/api/contracts";

interface ViolationRowProps {
  violation: Violation;
  index: number;
}

export function ViolationRow({ violation, index }: ViolationRowProps) {
  const [expanded, setExpanded] = useState(false);

  const isBlocking = violation.mode === "enforce";
  const Icon = isBlocking ? ShieldAlert : AlertTriangle;
  const borderColor = isBlocking ? "border-red-500" : "border-amber-500";
  const iconColor = isBlocking ? "text-red-500" : "text-amber-500";

  return (
    <div className={`border border-slate-200 rounded-md overflow-hidden bg-white`}>
      {/* Header row */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
      >
        <div className={`flex-shrink-0 w-1 self-stretch rounded-full ${isBlocking ? "bg-red-500" : "bg-amber-400"}`} />

        <span className="text-slate-400 font-mono text-[10px] w-5 text-right flex-shrink-0">
          {String(index + 1).padStart(2, "0")}
        </span>

        <Icon className={`h-4 w-4 flex-shrink-0 ${iconColor}`} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-900">{violation.policy_name}</span>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
              {violation.policy_id}
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-0.5 truncate">
            {violation.resource && (
              <span className="font-mono">{violation.resource}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <SeverityBadge severity={violation.severity} />
          <PolicyModeBadge mode={violation.mode} />
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-400" />
          )}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className={`border-t border-l-4 ${borderColor} border-t-slate-100 px-5 py-4 space-y-4 bg-slate-50/50`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">What Failed</h4>
              <p className="text-sm text-slate-800 leading-relaxed">{violation.what_failed}</p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Why It Matters</h4>
              <p className="text-sm text-slate-800 leading-relaxed">{violation.why_it_matters}</p>
            </div>
          </div>

          {violation.remediation && (
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Remediation</h4>
              <div className="text-sm text-slate-700 bg-white border border-slate-200 rounded-md p-3 leading-relaxed">
                {violation.remediation}
              </div>
            </div>
          )}

          {violation.resource && (
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Resource</h4>
              <CodeViewer code={violation.resource} label="resource" maxHeight="80px" showCopy={false} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
