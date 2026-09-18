"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, KeyRound, AlertCircle, Loader2, ArrowRight, X } from "lucide-react";
import Link from "next/link";

interface StartAssessmentButtonProps {
  quizId: string;
  hasPasscode: boolean;
  hasInProgressAttempt: boolean;
}

export function StartAssessmentButton({
  quizId,
  hasPasscode,
  hasInProgressAttempt,
}: StartAssessmentButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If attempt is already in progress, link directly to take page
  if (hasInProgressAttempt) {
    return (
      <Link
        href={`/quiz/${quizId}/take`}
        className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-orange-500 text-white text-sm font-bold shadow-xl shadow-amber-600/30 transition-all transform hover:-translate-y-0.5 flex items-center space-x-2"
      >
        <Play className="w-4 h-4 fill-white" />
        <span>Resume Assessment</span>
        <ArrowRight className="w-4 h-4" />
      </Link>
    );
  }

  // If no passcode required, link directly
  if (!hasPasscode) {
    return (
      <Link
        href={`/quiz/${quizId}/take`}
        className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-bold shadow-xl shadow-cyan-600/30 transition-all transform hover:-translate-y-0.5 flex items-center space-x-2"
      >
        <Play className="w-4 h-4 fill-white" />
        <span>Start Assessment</span>
        <ArrowRight className="w-4 h-4" />
      </Link>
    );
  }

  const startAttemptWithPasscode = async (passcodeToUse: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/user/attempt/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId, passcode: passcodeToUse.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to start quiz.");
      }

      if (typeof window !== "undefined") {
        sessionStorage.setItem(`semaphore_passcode_${quizId}`, passcodeToUse.trim());
        sessionStorage.setItem("semaphore_last_passcode", passcodeToUse.trim());
      }

      router.push(`/quiz/${quizId}/take`);
      return true;
    } catch (err: any) {
      setError(err.message || "Failed to start quiz.");
      setLoading(false);
      return false;
    }
  };

  const handleStartButtonClick = async () => {
    setError(null);

    // Check if passcode is stored in sessionStorage
    if (typeof window !== "undefined") {
      const storedPasscode =
        sessionStorage.getItem(`semaphore_passcode_${quizId}`) ||
        sessionStorage.getItem("semaphore_last_passcode");

      if (storedPasscode) {
        const success = await startAttemptWithPasscode(storedPasscode);
        if (success) return;
      }
    }

    // Fallback: prompt for passcode
    setPasscode("");
    setIsOpen(true);
  };

  const handleStartWithPasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) {
      setError("Please enter the quiz passcode.");
      return;
    }
    await startAttemptWithPasscode(passcode);
  };

  return (
    <>
      <button
        onClick={handleStartButtonClick}
        disabled={loading}
        type="button"
        className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-bold shadow-xl shadow-cyan-600/30 transition-all transform hover:-translate-y-0.5 flex items-center space-x-2 cursor-pointer disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin fill-white" />
            <span>Starting Assessment...</span>
          </>
        ) : (
          <>
            <Play className="w-4 h-4 fill-white" />
            <span>Start Assessment</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5">
            <button
              onClick={() => setIsOpen(false)}
              disabled={loading}
              type="button"
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Quiz Passcode Required
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enter the passcode provided by the administrator to begin.
                </p>
              </div>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleStartWithPasscode} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Passcode
                </label>
                <input
                  type="text"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter passcode (e.g. SEM2026)"
                  autoFocus
                  required
                  disabled={loading}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 uppercase"
                />
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-100 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60">
                ⚠️ <strong>1 User Per Team:</strong> Once started, no other member from your team can take this quiz. Timer will start immediately.
              </div>

              <div className="flex items-center space-x-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={loading}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !passcode.trim()}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-cyan-600/20 transition-all flex items-center justify-center space-x-1.5"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Validating...</span>
                    </>
                  ) : (
                    <>
                      <span>Enter Assessment</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
