import type { PolicyMode } from "@/api/contracts";

interface PolicyModeBadgeProps {
  mode: PolicyMode;
}

export function PolicyModeBadge({ mode }: PolicyModeBadgeProps) {
  if (mode === "enforce") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-md bg-blue-600 text-white">
        <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
        Enforce
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md bg-slate-100 text-slate-600 border border-slate-200">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
      Audit
    </span>
  );
}
