import type { ReactNode } from "react";
import { SearchX } from "lucide-react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 text-slate-400 mb-4">
        {icon ?? <SearchX className="h-5 w-5" />}
      </div>
      <p className="text-sm font-semibold text-slate-800 mb-1">{title}</p>
      {description && (
        <p className="text-sm text-slate-500 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
