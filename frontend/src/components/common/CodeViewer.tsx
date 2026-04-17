import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CodeViewerProps {
  code: string;
  language?: string;
  label?: string;
  maxHeight?: string;
  showCopy?: boolean;
}

export function CodeViewer({
  code,
  label,
  maxHeight = "320px",
  showCopy = true,
}: CodeViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="rounded-md border border-slate-700 bg-[#0d1117] overflow-hidden text-xs">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700/60 bg-slate-800/60">
        <span className="text-slate-400 font-mono tracking-wider text-[10px] uppercase">
          {label ?? "Code"}
        </span>
        {showCopy && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors text-[11px]"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copy
              </>
            )}
          </button>
        )}
      </div>

      {/* Code content */}
      <div
        className="overflow-auto"
        style={{ maxHeight }}
      >
        <pre className="p-4 text-slate-300 font-mono leading-relaxed whitespace-pre">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}
