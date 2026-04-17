import { useState } from "react";
import { ChevronDown, ChevronRight, Copy, Check } from "lucide-react";

interface JsonAccordionProps {
  label: string;
  data: unknown;
  defaultOpen?: boolean;
}

export function JsonAccordion({ label, data, defaultOpen = false }: JsonAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [copied, setCopied] = useState(false);

  const json = JSON.stringify(data, null, 2);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(json).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="border border-slate-200 rounded-md overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          {open ? (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-400" />
          )}
          {label}
        </div>
        {open && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 transition-colors"
          >
            {copied ? (
              <><Check className="h-3 w-3 text-emerald-500" /> Copied</>
            ) : (
              <><Copy className="h-3 w-3" /> Copy JSON</>
            )}
          </button>
        )}
      </button>

      {open && (
        <div className="bg-[#0d1117] max-h-[400px] overflow-auto">
          <pre className="p-4 text-xs text-slate-300 font-mono leading-relaxed">
            {json}
          </pre>
        </div>
      )}
    </div>
  );
}
