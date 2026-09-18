"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CodeViewer } from "@/components/quiz/CodeViewer";
import {
  ArrowLeft,
  Eye,
  CheckCircle2,
  Clock,
  Layers,
  HelpCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface OptionItem {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface QuestionItem {
  id: string;
  type: string;
  text: string;
  codeSnippet?: string | null;
  codeLanguage?: string | null;
  imageUrl?: string | null;
  marks: number;
  options: OptionItem[];
}

interface SectionItem {
  id: string;
  title: string;
  description?: string | null;
  questions: QuestionItem[];
}

interface QuizData {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  status: string;
  sections: SectionItem[];
}

export default function AdminQuizPreviewPage() {
  const params = useParams();
  const quizId = params.id as string;

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [showAnswers, setShowAnswers] = useState(true);

  useEffect(() => {
    async function loadQuiz() {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/quizzes/${quizId}`);
        const data = await res.json();
        if (res.ok && data.quiz) {
          setQuiz(data.quiz);
        } else {
          throw new Error(data.error || "Quiz not found.");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load preview.");
      } finally {
        setLoading(false);
      }
    }

    if (quizId) loadQuiz();
  }, [quizId]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3 text-cyan-400">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="text-xs text-slate-400">Loading quiz preview...</p>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="p-8 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <p className="text-sm text-slate-400">{error || "Quiz not found."}</p>
        <Link href="/admin/quizzes" className="text-cyan-500 text-xs font-bold">
          Return to Quizzes
        </Link>
      </div>
    );
  }

  const allQuestions = quiz.sections.flatMap((s) => s.questions);
  const totalMarks = allQuestions.reduce((a, q) => a + q.marks, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <Link
          href={`/admin/quizzes/${quizId}/sections`}
          className="flex items-center space-x-2 text-xs sm:text-sm font-semibold text-cyan-600 dark:text-cyan-400 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Sections Editor</span>
        </Link>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setShowAnswers(!showAnswers)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              showAnswers
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700"
            }`}
          >
            {showAnswers ? "Hide Correct Answers" : "Reveal Correct Answers"}
          </button>
        </div>
      </div>

      {/* Preview Header Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-cyan-500/30 shadow-xl space-y-3">
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-cyan-500">
          <Eye className="w-4 h-4" />
          <span>Administrator Interactive Preview</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">
          {quiz.title}
        </h1>
        {quiz.description && (
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            {quiz.description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span className="flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-cyan-500" />
            <span>{quiz.durationMinutes || 45} mins</span>
          </span>
          <span>•</span>
          <span>{quiz.sections.length} Sections</span>
          <span>•</span>
          <span>
            {allQuestions.length} Questions ({totalMarks} Total Marks)
          </span>
        </div>
      </div>

      {/* Sections and Questions */}
      <div className="space-y-8">
        {quiz.sections.map((sec, sIdx) => (
          <div key={sec.id} className="space-y-4">
            <div className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800/80 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center justify-between">
              <span>
                Section {sIdx + 1}: {sec.title}
              </span>
              <span>{sec.questions.length} Questions</span>
            </div>

            {sec.questions.map((q, qIdx) => (
              <div
                key={q.id}
                className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-md space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">
                    Question {qIdx + 1}
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                    {q.marks} {q.marks === 1 ? "Mark" : "Marks"}
                  </span>
                </div>

                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {q.text}
                </h3>

                {q.type === "CODE" && q.codeSnippet && (
                  <CodeViewer
                    code={q.codeSnippet}
                    language={q.codeLanguage || "javascript"}
                  />
                )}

                {q.type === "IMAGE" && q.imageUrl && (
                  <div className="my-2 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 flex items-center justify-center bg-slate-950/20 min-h-[120px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={q.imageUrl}
                      alt="Question illustration"
                      className="max-h-72 w-full object-contain rounded"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        const t = e.currentTarget;
                        t.style.display = "none";
                        const p = t.parentElement;
                        if (p && !p.querySelector(".img-error-msg")) {
                          const d = document.createElement("div");
                          d.className = "img-error-msg py-8 text-center text-slate-400 text-xs space-y-1";
                          d.innerHTML = `<div class="text-2xl">🖼️</div><div>Image could not be loaded</div>`;
                          p.appendChild(d);
                        }
                      }}
                    />
                  </div>
                )}

                {/* Options */}
                <div className="space-y-2 pt-2">
                  {q.options.map((opt, oIdx) => {
                    const isSelected = selectedAnswers[q.id] === opt.id;
                    const isCorrect = opt.isCorrect;

                    let optClass =
                      "p-3.5 rounded-xl border text-sm flex items-center justify-between cursor-pointer transition-all ";

                    if (showAnswers && isCorrect) {
                      optClass +=
                        "bg-emerald-500/10 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-bold ";
                    } else if (isSelected) {
                      optClass +=
                        "bg-cyan-500/10 border-cyan-500 text-cyan-700 dark:text-cyan-300 ";
                    } else {
                      optClass +=
                        "bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 hover:border-cyan-400 ";
                    }

                    return (
                      <div
                        key={opt.id}
                        onClick={() =>
                          setSelectedAnswers((prev) => ({
                            ...prev,
                            [q.id]: opt.id,
                          }))
                        }
                        className={optClass}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="font-bold text-xs">
                            {String.fromCharCode(65 + oIdx)}.
                          </span>
                          <span>{opt.text}</span>
                        </div>

                        {showAnswers && isCorrect && (
                          <span className="flex items-center space-x-1 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Correct Answer</span>
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
