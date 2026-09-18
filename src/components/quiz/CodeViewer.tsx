"use client";

import React, { useState } from "react";
import { Check, Copy, Terminal } from "lucide-react";

interface CodeViewerProps {
  code: string;
  language?: string | null;
}

export function CodeViewer({ code, language = "code" }: CodeViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.trim().split("\n");

  return (
    <div className="my-4 rounded-xl border border-cyan-900/40 bg-slate-950/90 shadow-lg overflow-hidden backdrop-blur-md">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-cyan-950/80 bg-slate-900/70 text-xs">
        <div className="flex items-center space-x-2">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-mono uppercase font-semibold text-cyan-300 tracking-wider">
            {language || "code"}
          </span>
        </div>
        <button
          onClick={handleCopy}
          type="button"
          className="flex items-center space-x-1 text-slate-400 hover:text-cyan-300 transition-colors py-0.5 px-2 rounded hover:bg-cyan-950/40"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code with Line numbers */}
      <div className="p-4 overflow-x-auto font-mono text-sm leading-relaxed text-cyan-100/90 flex">
        <div className="select-none pr-4 text-slate-600 dark:text-slate-600 text-right font-mono text-xs leading-relaxed border-r border-slate-800">
          {lines.map((_, i) => (
            <div key={i} className="h-6">
              {i + 1}
            </div>
          ))}
        </div>
        <div className="pl-4 flex-1">
          {lines.map((line, i) => (
            <div key={i} className="h-6 whitespace-pre">
              {line || " "}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
