import type { Severity } from "@/api/contracts";

interface SeverityBadgeProps {
  severity: Severity;
  size?: "sm" | "md";
}

const config: Record<Severity, { className: string }> = {
  Critical: { className: "bg-red-100 text-red-800 border border-red-200" },
  High:     { className: "bg-orange-100 text-orange-800 border border-orange-200" },
  Medium:   { className: "bg-amber-100 text-amber-800 border border-amber-200" },
  Low:      { className: "bg-slate-100 text-slate-700 border border-slate-200" },
};

export function SeverityBadge({ severity, size = "sm" }: SeverityBadgeProps) {
  const { className } = config[severity] ?? config.Low;
  const sizeClass = size === "md" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs";

  return (
    <span className={`inline-flex items-center font-semibold rounded-md ${sizeClass} ${className}`}>
      {severity}
    </span>
  );
}
