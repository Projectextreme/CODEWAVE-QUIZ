"use client";

import React from "react";
import { AlertCircle, CheckCircle2, Bookmark, Send, X } from "lucide-react";

interface SubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  totalQuestions: number;
  answeredCount: number;
  unansweredCount: number;
  reviewCount: number;
}

export function SubmitModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
  totalQuestions,
  answeredCount,
  unansweredCount,
  reviewCount,
}: SubmitModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 md:p-8 space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          type="button"
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
            <Send className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Submit Assessment?
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Please review your summary before finalizing.
            </p>
          </div>
        </div>

        {/* Breakdown stats cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
            <div className="flex items-center justify-center space-x-1 text-emerald-600 dark:text-emerald-400 mb-1">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xs font-semibold">Answered</span>
            </div>
            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
              {answeredCount}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
            <div className="flex items-center justify-center space-x-1 text-slate-600 dark:text-slate-400 mb-1">
              <AlertCircle className="w-4 h-4" />
              <span className="text-xs font-semibold">Unanswered</span>
            </div>
            <div className="text-2xl font-black text-slate-700 dark:text-slate-300">
              {unansweredCount}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
            <div className="flex items-center justify-center space-x-1 text-amber-600 dark:text-amber-400 mb-1">
              <Bookmark className="w-4 h-4" />
              <span className="text-xs font-semibold">Marked</span>
            </div>
            <div className="text-2xl font-black text-amber-700 dark:text-amber-300">
              {reviewCount}
            </div>
          </div>
        </div>

        {unansweredCount > 0 && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span>
              You still have <strong>{unansweredCount}</strong> unanswered{" "}
              {unansweredCount === 1 ? "question" : "questions"}. Once submitted,
              you cannot change your responses.
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center space-x-3 pt-2">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            type="button"
            className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold transition-colors disabled:opacity-50"
          >
            Continue Quiz
          </button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            type="button"
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-semibold shadow-lg shadow-emerald-600/30 transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <span className="animate-pulse">Submitting...</span>
            ) : (
              <span>Confirm & Submit</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
