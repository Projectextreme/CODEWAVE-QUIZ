"use client";

import React, { useEffect, useState } from "react";
import { Clock, CheckCircle2, RefreshCw, AlertTriangle } from "lucide-react";
import { ThemeToggle } from "../layout/ThemeToggle";

interface QuizHeaderProps {
  title: string;
  totalQuestions: number;
  initialSecondsRemaining: number;
  isSaving: boolean;
  onTimeExpire: () => void;
}

export function QuizHeader({
  title,
  totalQuestions,
  initialSecondsRemaining,
  isSaving,
  onTimeExpire,
}: QuizHeaderProps) {
  const [secondsLeft, setSecondsLeft] = useState(initialSecondsRemaining);

  useEffect(() => {
    setSecondsLeft(initialSecondsRemaining);
  }, [initialSecondsRemaining]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onTimeExpire();
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsLeft, onTimeExpire]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isUrgent = secondsLeft > 0 && secondsLeft <= 300; // < 5 minutes

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-200 dark:border-slate-800/80 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Quiz Title */}
        <div className="flex items-center space-x-3 truncate">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-sky-400 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-cyan-500/20 shrink-0">
            Q
          </div>
          <div className="truncate">
            <h1 className="text-sm md:text-base font-bold text-slate-900 dark:text-slate-100 truncate">
              {title}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              {totalQuestions} Total Questions
            </p>
          </div>
        </div>

        {/* Center: Save status */}
        <div className="hidden md:flex items-center space-x-2 text-xs">
          {isSaving ? (
            <span className="flex items-center space-x-1.5 text-cyan-600 dark:text-cyan-400 font-medium">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Saving answer...</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Answers synced</span>
            </span>
          )}
        </div>

        {/* Right: Timer & Theme */}
        <div className="flex items-center space-x-3">
          {/* Timer Display */}
          <div
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl border font-mono font-bold text-sm md:text-base transition-all ${
              isUrgent
                ? "bg-rose-500/10 dark:bg-rose-950/40 border-rose-500/50 text-rose-600 dark:text-rose-400 animate-pulse-subtle"
                : "bg-cyan-500/10 dark:bg-cyan-950/40 border-cyan-500/30 text-cyan-700 dark:text-cyan-300"
            }`}
          >
            {isUrgent ? (
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            ) : (
              <Clock className="w-4 h-4 text-cyan-500" />
            )}
            <span>
              {minutes.toString().padStart(2, "0")}:
              {seconds.toString().padStart(2, "0")}
            </span>
          </div>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
