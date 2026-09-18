"use client";

import React from "react";
import { CodeViewer } from "./CodeViewer";
import { Bookmark, BookmarkCheck, RotateCcw, Image as ImageIcon } from "lucide-react";

export interface OptionItem {
  id: string;
  text: string;
  orderIndex: number;
}

export interface QuestionItem {
  id: string;
  sectionId: string;
  type: "THEORY" | "CODE" | "IMAGE";
  text: string;
  codeSnippet?: string | null;
  codeLanguage?: string | null;
  imageUrl?: string | null;
  marks: number;
  orderIndex: number;
  options: OptionItem[];
}

interface QuestionCardProps {
  question: QuestionItem;
  questionNumber: number;
  totalQuestions: number;
  sectionTitle: string;
  selectedOptionId: string | null;
  isMarkedForReview: boolean;
  onSelectOption: (optionId: string) => void;
  onClearOption: () => void;
  onToggleReview: () => void;
  onPrevious: () => void;
  onNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
}

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  sectionTitle,
  selectedOptionId,
  isMarkedForReview,
  onSelectOption,
  onClearOption,
  onToggleReview,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
}: QuestionCardProps) {
  return (
    <div className="flex flex-col bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden backdrop-blur-md transition-all">
      {/* Top Meta Bar */}
      <div className="flex flex-wrap items-center justify-between px-6 py-4 bg-slate-50/80 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800/80 gap-3">
        <div className="flex items-center space-x-3">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
            {sectionTitle}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            {question.marks} {question.marks === 1 ? "Mark" : "Marks"}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onToggleReview}
            type="button"
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              isMarkedForReview
                ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40"
                : "bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 hover:text-amber-500 border border-transparent"
            }`}
          >
            {isMarkedForReview ? (
              <>
                <BookmarkCheck className="w-3.5 h-3.5 text-amber-500" />
                <span>Marked for Review</span>
              </>
            ) : (
              <>
                <Bookmark className="w-3.5 h-3.5" />
                <span>Mark for Review</span>
              </>
            )}
          </button>

          {selectedOptionId && (
            <button
              onClick={onClearOption}
              type="button"
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
              title="Clear selection"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Question Body */}
      <div className="p-6 md:p-8 space-y-6 flex-1">
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Question {questionNumber} of {totalQuestions}
          </div>
          <h2 className="text-lg md:text-xl font-medium leading-relaxed text-slate-900 dark:text-slate-100">
            {question.text}
          </h2>
        </div>

        {/* Code Snippet if applicable */}
        {question.type === "CODE" && question.codeSnippet && (
          <CodeViewer
            code={question.codeSnippet}
            language={question.codeLanguage || "javascript"}
          />
        )}

        {/* Image if applicable */}
        {question.type === "IMAGE" && question.imageUrl && (
          <div className="my-4 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 flex items-center justify-center bg-slate-950/20 min-h-[120px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={question.imageUrl}
              alt="Question illustration"
              className="max-h-96 w-full object-contain rounded-lg shadow"
              crossOrigin="anonymous"
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = "none";
                const parent = target.parentElement;
                if (parent && !parent.querySelector(".img-error-msg")) {
                  const msg = document.createElement("div");
                  msg.className = "img-error-msg flex flex-col items-center space-y-2 py-6 text-slate-400 text-xs";
                  msg.innerHTML = `<span class="text-2xl">🖼️</span><span>Image could not be loaded</span>`;
                  parent.appendChild(msg);
                }
              }}
            />
          </div>
        )}

        {/* Options List */}
        <div className="pt-2 space-y-3">
          {question.options.map((opt, idx) => {
            const isSelected = selectedOptionId === opt.id;
            const letter = OPTION_LETTERS[idx] || String(idx + 1);

            return (
              <div
                key={opt.id}
                onClick={() => onSelectOption(opt.id)}
                className={`group flex items-start space-x-4 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? "bg-cyan-500/10 dark:bg-cyan-950/40 border-cyan-500 dark:border-cyan-400 shadow-md ring-1 ring-cyan-500/30"
                    : "bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800/70 hover:bg-cyan-50/50 dark:hover:bg-slate-800/80 hover:border-cyan-300 dark:hover:border-cyan-800"
                }`}
              >
                {/* Letter indicator */}
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-colors shrink-0 mt-0.5 ${
                    isSelected
                      ? "bg-cyan-600 dark:bg-cyan-500 text-white shadow-sm"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-cyan-500/20 group-hover:text-cyan-600 dark:group-hover:text-cyan-400"
                  }`}
                >
                  {letter}
                </div>

                {/* Option text */}
                <div className="flex-1 text-sm md:text-base leading-relaxed text-slate-800 dark:text-slate-200 select-none">
                  {opt.text}
                </div>

                {/* Radio checkmark ring */}
                <div className="shrink-0 mt-1">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                      isSelected
                        ? "border-cyan-500 bg-cyan-500 dark:bg-cyan-400 dark:border-cyan-400"
                        : "border-slate-300 dark:border-slate-700 group-hover:border-cyan-400"
                    }`}
                  >
                    {isSelected && (
                      <div className="w-1.5 h-1.5 bg-white dark:bg-slate-900 rounded-full" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-50/80 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800/80">
        <button
          onClick={onPrevious}
          disabled={!hasPrevious}
          type="button"
          className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
        >
          ← Previous
        </button>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          {questionNumber} / {totalQuestions}
        </div>

        <button
          onClick={onNext}
          disabled={!hasNext}
          type="button"
          className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/20"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
