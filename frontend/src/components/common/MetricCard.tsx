import type { ReactNode } from "react";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  sub?: string;
  accent?: "default" | "green" | "amber" | "red" | "blue";
}

const accentMap: Record<string, string> = {
  default: "text-slate-900",
  green:   "text-emerald-700",
  amber:   "text-amber-700",
  red:     "text-red-700",
  blue:    "text-blue-700",
};

export function MetricCard({ label, value, icon, sub, accent = "default" }: MetricCardProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex flex-col gap-1">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        {icon && <span className="text-slate-400">{icon}</span>}
      </div>
      <span className={`text-3xl font-bold tabular-nums ${accentMap[accent]}`}>{value}</span>
      {sub && <span className="text-xs text-slate-400 mt-0.5">{sub}</span>}
    </div>
  );
}
