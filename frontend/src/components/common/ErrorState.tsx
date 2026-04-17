import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 text-red-500 mb-4 border border-red-100">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <p className="text-sm font-semibold text-slate-800 mb-1">{title}</p>
      <p className="text-xs text-slate-500 max-w-sm font-mono bg-slate-50 px-3 py-1.5 rounded border border-slate-200 mt-1">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </button>
      )}
    </div>
  );
}
