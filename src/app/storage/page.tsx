"use client";

import React, { useState, useEffect } from "react";
import {
  getAllQuizBackupsFromLocalStorage,
  QuizLocalStorageBackup,
} from "@/lib/storage-recovery";
import {
  Lock,
  Unlock,
  Database,
  Download,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  FileJson,
  RefreshCw,
  LogOut,
  Calendar,
  Clock,
  Layers,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

// SHA-256 hash of "semaphore-2k26"
const VALID_HASH = "31d8efd91aba26d369efeb02d65e654688d9dcfa0cebcc18e5517c6e21239e64";

async function sha256(str: string): Promise<string> {
  const buffer = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function StorageRecoveryPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passcode, setPasscode] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [backups, setBackups] = useState<QuizLocalStorageBackup[]>([]);
  const [expandedQuizId, setExpandedQuizId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Check session storage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isAuth = sessionStorage.getItem("semaphore_storage_auth") === "true";
      if (isAuth) {
        setIsAuthenticated(true);
        loadBackups();
      }
    }
  }, []);

  const loadBackups = () => {
    const list = getAllQuizBackupsFromLocalStorage();
    setBackups(list);
    if (list.length > 0 && !expandedQuizId) {
      setExpandedQuizId(list[0].quizId);
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const input = passcode.trim();
    if (!input) {
      setAuthError("Please enter the storage access passcode.");
      return;
    }

    try {
      // Check against env or SHA-256 hash
      const envPasscode = process.env.NEXT_PUBLIC_STORAGE_PASSCODE;
      const computedHash = await sha256(input);

      const isValid =
        (envPasscode && input === envPasscode.trim()) ||
        computedHash === VALID_HASH ||
        input.toLowerCase() === "semaphore-2k26";

      if (isValid) {
        sessionStorage.setItem("semaphore_storage_auth", "true");
        setIsAuthenticated(true);
        loadBackups();
      } else {
        setAuthError("Invalid access passcode.");
      }
    } catch (err) {
      setAuthError("Failed to authenticate offline.");
    }
  };

  const handleLock = () => {
    sessionStorage.removeItem("semaphore_storage_auth");
    setIsAuthenticated(false);
    setPasscode("");
  };

  const copyToClipboard = (data: any, key: string) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const downloadJson = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 1. Password Protection Gate
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-[#070d1e] text-slate-900 dark:text-white">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Local Storage Archive</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Offline Answer Recovery Console
              </p>
            </div>
          </div>

          {authError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                Enter Passcode
              </label>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Storage Passcode"
                autoFocus
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-base focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-100 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60">
              🔒 Verifies offline entirely within your browser. Displays client-stored answer snapshots intended for submission and scoring recovery.
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-600/20 transition-all flex items-center justify-center space-x-1.5"
            >
              <Unlock className="w-4 h-4" />
              <span>Unlock Storage Archive</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. Unlocked Storage Viewer
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070d1e] text-slate-900 dark:text-slate-100 transition-colors pb-12">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-200 dark:border-slate-800/80 shadow-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <span>Local Storage Recovery</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Offline Active
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {backups.length} {backups.length === 1 ? "Quiz Backup" : "Quiz Backups"} Found
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={loadBackups}
              type="button"
              className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-bold transition-all flex items-center space-x-1.5"
              title="Refresh from localStorage"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {backups.length > 0 && (
              <button
                onClick={() =>
                  downloadJson(
                    backups,
                    `semaphore_all_backups_${new Date().toISOString().slice(0, 10)}.json`
                  )
                }
                type="button"
                className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-600/20 transition-all flex items-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export All</span>
              </button>
            )}

            <button
              onClick={handleLock}
              type="button"
              className="px-3 py-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition-all flex items-center space-x-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Lock</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {backups.length === 0 ? (
          <div className="p-12 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center space-y-3 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
              <FileJson className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              No Quiz Backups Found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Answers are automatically saved to browser localStorage when a participant answers or submits a quiz in this browser session.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {backups.map((backup) => {
              const isExpanded = expandedQuizId === backup.quizId;
              const answerEntries = Object.values(backup.answers || {});

              return (
                <div
                  key={backup.quizId}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden transition-all"
                >
                  {/* Card Header */}
                  <div
                    onClick={() =>
                      setExpandedQuizId(isExpanded ? null : backup.quizId)
                    }
                    className="p-5 sm:p-6 cursor-pointer flex flex-wrap items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/20 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-200 dark:border-slate-800"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2.5">
                        <span
                          className={`text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                            backup.status === "SUBMITTED"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {backup.status}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          ID: {backup.quizId}
                        </span>
                      </div>

                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        {backup.quizTitle || "Untitled Quiz"}
                      </h2>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right text-xs">
                        <div className="font-bold text-slate-700 dark:text-slate-200">
                          {backup.answeredCount} Answered
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Saved: {formatDate(backup.lastSavedAt)}
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Body */}
                  {isExpanded && (
                    <div className="p-5 sm:p-6 space-y-6">
                      {/* Meta Summary bar */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                          <span className="text-[11px] text-slate-400 uppercase font-semibold">
                            Attempt ID
                          </span>
                          <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                            {backup.attemptId || "N/A"}
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                          <span className="text-[11px] text-slate-400 uppercase font-semibold">
                            Started At
                          </span>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                            {formatDate(backup.startedAt)}
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                          <span className="text-[11px] text-slate-400 uppercase font-semibold">
                            Submitted At
                          </span>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                            {backup.submittedAt
                              ? formatDate(backup.submittedAt)
                              : "Not submitted yet"}
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                          <span className="text-[11px] text-slate-400 uppercase font-semibold">
                            Recorded Answers
                          </span>
                          <div className="text-xs font-bold text-cyan-600 dark:text-cyan-400 truncate mt-0.5">
                            {answerEntries.length} Questions Recorded
                          </div>
                        </div>
                      </div>

                      {/* Action Bar for this Quiz */}
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => copyToClipboard(backup, backup.quizId)}
                          type="button"
                          className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center space-x-1.5"
                        >
                          {copiedKey === backup.quizId ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-emerald-500">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy JSON</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() =>
                            downloadJson(
                              backup,
                              `semaphore_quiz_${backup.quizId}_backup.json`
                            )
                          }
                          type="button"
                          className="px-4 py-2 rounded-xl bg-cyan-600/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-600/20 text-xs font-bold border border-cyan-500/20 transition-all flex items-center space-x-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download JSON File</span>
                        </button>
                      </div>

                      {/* Detailed Answers Table */}
                      <div className="space-y-3 pt-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Saved Responses Breakdown
                        </h3>

                        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                                <th className="p-3">#</th>
                                <th className="p-3">Question ID & Text</th>
                                <th className="p-3">Selected Option ID</th>
                                <th className="p-3">Selected Text</th>
                                <th className="p-3">Review Flag</th>
                                <th className="p-3">Saved At</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                              {answerEntries.map((ans, idx) => (
                                <tr
                                  key={ans.questionId}
                                  className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                                >
                                  <td className="p-3 font-sans font-bold text-slate-500">
                                    {idx + 1}
                                  </td>
                                  <td className="p-3 font-sans max-w-xs">
                                    <div className="text-[11px] text-slate-400 truncate">
                                      {ans.questionId}
                                    </div>
                                    <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
                                      {ans.questionText || "Question text not cached"}
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    {ans.selectedOptionId ? (
                                      <span className="text-cyan-600 dark:text-cyan-400 font-bold">
                                        {ans.selectedOptionId}
                                      </span>
                                    ) : (
                                      <span className="text-slate-400 font-sans italic">
                                        Unanswered
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-3 font-sans max-w-xs truncate text-slate-700 dark:text-slate-300">
                                    {ans.selectedOptionText || "—"}
                                  </td>
                                  <td className="p-3 font-sans">
                                    {ans.isMarkedForReview ? (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                        Marked
                                      </span>
                                    ) : (
                                      <span className="text-slate-400 text-[11px]">
                                        No
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-3 text-[11px] text-slate-400 font-sans">
                                    {formatDate(ans.updatedAt)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
