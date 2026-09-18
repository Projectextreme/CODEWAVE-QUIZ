"use client";

import React from "react";
import { Bookmark, Send } from "lucide-react";

export interface FlatQuestion {
  id: string;
  sectionId: string;
  sectionTitle: string;
  orderIndex: number;
  globalIndex: number;
}

interface QuestionPaletteProps {
  questions: FlatQuestion[];
  currentIndex: number;
  answers: Record<string, string | null>;
  reviewMarks: Record<string, boolean>;
  onSelectIndex: (index: number) => void;
  onSubmitClick: () => void;
}

export function QuestionPalette({
  questions,
  currentIndex,
  answers,
  reviewMarks,
  onSelectIndex,
  onSubmitClick,
}: QuestionPaletteProps) {
  const answeredCount = questions.filter(
    (q) => answers[q.id] !== undefined && answers[q.id] !== null
  ).length;
  const reviewCount = questions.filter((q) => reviewMarks[q.id]).length;
  const unansweredCount = questions.length - answeredCount;

  return (
    <div className="flex flex-col bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden backdrop-blur-md">
      {/* Header */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
          <span>Question Palette</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
            {questions.length} Questions
          </span>
        </h3>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-md bg-emerald-500 shadow-sm" />
            <span className="text-slate-600 dark:text-slate-400">
              Answered ({answeredCount})
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-md bg-amber-500 shadow-sm" />
            <span className="text-slate-600 dark:text-slate-400">
              Review ({reviewCount})
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-md bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700" />
            <span className="text-slate-600 dark:text-slate-400">
              Unanswered ({unansweredCount})
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-md ring-2 ring-cyan-500 bg-cyan-500/30" />
            <span className="text-slate-600 dark:text-slate-400">Current</span>
          </div>
        </div>
      </div>

      {/* Grid of question buttons */}
      <div className="p-5 max-h-[50vh] overflow-y-auto">
        <div className="grid grid-cols-5 gap-2.5">
          {questions.map((q, idx) => {
            const isCurrent = idx === currentIndex;
            const isAnswered =
              answers[q.id] !== undefined && answers[q.id] !== null;
            const isReview = Boolean(reviewMarks[q.id]);

            let btnClasses =
              "relative flex items-center justify-center h-10 w-full rounded-xl text-xs font-bold transition-all duration-150 select-none cursor-pointer ";

            if (isCurrent) {
              btnClasses +=
                "ring-2 ring-offset-2 ring-cyan-500 dark:ring-offset-slate-900 ";
            }

            if (isReview) {
              btnClasses += "bg-amber-500 text-white shadow-sm hover:bg-amber-600 ";
            } else if (isAnswered) {
              btnClasses +=
                "bg-emerald-600 text-white shadow-sm hover:bg-emerald-500 ";
            } else {
              btnClasses +=
                "bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-cyan-400 dark:hover:border-cyan-500 ";
            }

            return (
              <button
                key={q.id}
                onClick={() => onSelectIndex(idx)}
                type="button"
                className={btnClasses}
                title={`Question ${idx + 1} (${q.sectionTitle})`}
              >
                <span>{idx + 1}</span>
                {isReview && (
                  <Bookmark className="w-2.5 h-2.5 absolute top-1 right-1 fill-white text-white" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit Button */}
      <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60">
        <button
          onClick={onSubmitClick}
          type="button"
          className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/20 transition-all transform active:scale-[0.98]"
        >
          <Send className="w-4 h-4" />
          <span>Finish & Submit Quiz</span>
        </button>
      </div>
    </div>
  );
}
