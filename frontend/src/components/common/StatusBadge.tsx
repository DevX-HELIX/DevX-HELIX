import type { ValidationStatus } from "@/api/contracts";

interface StatusBadgeProps {
  status: ValidationStatus;
  size?: "sm" | "md";
}

const config: Record<ValidationStatus, { label: string; className: string }> = {
  PASSED: {
    label: "Passed",
    className: "bg-emerald-50 text-emerald-700 border border-emerald-200 ring-1 ring-emerald-200/50",
  },
  ADVISORY: {
    label: "Advisory",
    className: "bg-amber-50 text-amber-700 border border-amber-200 ring-1 ring-amber-200/50",
  },
  BLOCKED: {
    label: "Blocked",
    className: "bg-red-50 text-red-700 border border-red-200 ring-1 ring-red-200/50",
  },
};

export function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const { label, className } = config[status] ?? config.PASSED;
  const sizeClass = size === "md" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-md tracking-wide uppercase ${sizeClass} ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          status === "PASSED"
            ? "bg-emerald-500"
            : status === "ADVISORY"
            ? "bg-amber-500"
            : "bg-red-500"
        }`}
      />
      {label}
    </span>
  );
}
