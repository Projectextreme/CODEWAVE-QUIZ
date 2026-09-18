"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { QuizHeader } from "@/components/quiz/QuizHeader";
import {
  QuestionCard,
  QuestionItem,
} from "@/components/quiz/QuestionCard";
import {
  QuestionPalette,
  FlatQuestion,
} from "@/components/quiz/QuestionPalette";
import { SubmitModal } from "@/components/quiz/SubmitModal";
import { Loader2, AlertCircle, KeyRound, ArrowRight, ArrowLeft } from "lucide-react";
import {
  saveQuizToLocalStorage,
  SavedAnswerDetail,
  SavedQuestionDetail,
} from "@/lib/storage-recovery";

interface SectionData {
  id: string;
  title: string;
  description?: string | null;
  orderIndex: number;
  defaultMarks: number;
  questions: QuestionItem[];
}

interface ActiveQuizResponse {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  startTime: string | null;
  endTime: string | null;
  hasPasscode: boolean;
  sections: SectionData[];
  totalQuestions: number;
  totalMarks: number;
  userAttempt?: {
    id: string;
    status: string;
    startedAt: string;
    answers: Array<{
      questionId: string;
      selectedOptionId: string | null;
      isMarkedForReview: boolean;
    }>;
  } | null;
}

export default function TakeQuizPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.quizId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<ActiveQuizResponse | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);

  // Passcode gate state
  const [requiresPasscode, setRequiresPasscode] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState("");
  const [passcodeError, setPasscodeError] = useState<string | null>(null);
  const [validatingPasscode, setValidatingPasscode] = useState(false);

  // Flat question list
  const [flatQuestions, setFlatQuestions] = useState<FlatQuestion[]>([]);
  const [questionMap, setQuestionMap] = useState<Record<string, QuestionItem>>({});
  const [currentIndex, setCurrentIndex] = useState(0);

  // Answers & review marks
  const [answers, setAnswers] = useState<Record<string, string | null>>({});
  const [reviewMarks, setReviewMarks] = useState<Record<string, boolean>>({});

  // Sync / Timer / Submit states
  const [isSaving, setIsSaving] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(1800); // 30 min default
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to persist current quiz snapshot to browser localStorage for offline recovery
  const syncLocalStorageBackup = useCallback(
    (
      currentQuiz: ActiveQuizResponse | null,
      currAttemptId: string | null,
      currentAnswers: Record<string, string | null>,
      currentReviews: Record<string, boolean>,
      status: "IN_PROGRESS" | "SUBMITTED" = "IN_PROGRESS",
      submittedAtTime: string | null = null
    ) => {
      if (!currentQuiz) return;

      const answersMap: Record<string, SavedAnswerDetail> = {};
      const questionsSummary: SavedQuestionDetail[] = [];

      currentQuiz.sections.forEach((sec) => {
        sec.questions.forEach((q) => {
          const selectedId = currentAnswers[q.id] || null;
          const selectedOpt = q.options.find((o) => o.id === selectedId);

          answersMap[q.id] = {
            questionId: q.id,
            questionText: q.text,
            selectedOptionId: selectedId,
            selectedOptionText: selectedOpt ? selectedOpt.text : undefined,
            isMarkedForReview: Boolean(currentReviews[q.id]),
            updatedAt: new Date().toISOString(),
          };

          questionsSummary.push({
            id: q.id,
            text: q.text,
            sectionTitle: sec.title,
            options: q.options.map((o) => ({ id: o.id, text: o.text })),
          });
        });
      });

      const answeredCount = Object.values(currentAnswers).filter(
        (v) => v !== null && v !== undefined
      ).length;

      saveQuizToLocalStorage({
        quizId: currentQuiz.id,
        quizTitle: currentQuiz.title,
        attemptId: currAttemptId,
        status,
        startedAt: currentQuiz.userAttempt?.startedAt || new Date().toISOString(),
        lastSavedAt: new Date().toISOString(),
        submittedAt: submittedAtTime,
        totalQuestions: questionsSummary.length,
        answeredCount,
        answers: answersMap,
        questionsSummary,
      });
    },
    []
  );

  // Helper to initialize active session once attempt data is available
  const setupAttemptData = useCallback(
    (activeQuiz: ActiveQuizResponse, currentAttempt: any) => {
      setQuiz(activeQuiz);
      setAttemptId(currentAttempt.id);
      setRequiresPasscode(false);

      // Flatten questions
      const flat: FlatQuestion[] = [];
      const qMap: Record<string, QuestionItem> = {};
      const initialAnswers: Record<string, string | null> = {};
      const initialReviews: Record<string, boolean> = {};

      let globalIdx = 0;
      activeQuiz.sections.forEach((sec: SectionData) => {
        sec.questions.forEach((q: QuestionItem) => {
          flat.push({
            id: q.id,
            sectionId: sec.id,
            sectionTitle: sec.title,
            orderIndex: q.orderIndex,
            globalIndex: globalIdx,
          });
          qMap[q.id] = q;
          globalIdx++;
        });
      });

      // Populate previous answers if resuming
      if (currentAttempt.answers && Array.isArray(currentAttempt.answers)) {
        currentAttempt.answers.forEach((ans: any) => {
          if (ans.selectedOptionId) {
            initialAnswers[ans.questionId] = ans.selectedOptionId;
          }
          if (ans.isMarkedForReview) {
            initialReviews[ans.questionId] = true;
          }
        });
      }

      setFlatQuestions(flat);
      setQuestionMap(qMap);
      setAnswers(initialAnswers);
      setReviewMarks(initialReviews);

      // Persist snapshot to localStorage
      syncLocalStorageBackup(
        activeQuiz,
        currentAttempt.id,
        initialAnswers,
        initialReviews,
        currentAttempt.status === "SUBMITTED" ? "SUBMITTED" : "IN_PROGRESS",
        currentAttempt.submittedAt || null
      );

      // Calculate remaining seconds
      const startedAt = new Date(currentAttempt.startedAt).getTime();
      const now = Date.now();
      const durationSecs = (activeQuiz.durationMinutes || 45) * 60;
      const elapsedSecs = Math.floor((now - startedAt) / 1000);
      let remaining = Math.max(0, durationSecs - elapsedSecs);

      // Also check endTime if set
      if (activeQuiz.endTime) {
        const quizEnd = new Date(activeQuiz.endTime).getTime();
        const untilEnd = Math.max(0, Math.floor((quizEnd - now) / 1000));
        remaining = Math.min(remaining, untilEnd);
      }

      setSecondsRemaining(remaining);
    },
    [syncLocalStorageBackup]
  );

  // 1. Initial Assessment Gate Check
  useEffect(() => {
    let isMounted = true;

    async function initQuiz() {
      try {
        setLoading(true);
        setError(null);

        // Fetch active quiz data
        const quizRes = await fetch("/api/user/active-quiz");
        if (!quizRes.ok) {
          throw new Error("Unable to fetch active quiz.");
        }
        const { activeQuiz } = await quizRes.json();

        if (!activeQuiz || activeQuiz.id !== quizId) {
          throw new Error("This quiz is not currently active.");
        }

        if (!isMounted) return;
        setQuiz(activeQuiz);

        // If user already has an active attempt, resume it immediately
        if (activeQuiz.userAttempt) {
          if (activeQuiz.userAttempt.status === "SUBMITTED") {
            router.replace(`/quiz/${quizId}/result/${activeQuiz.userAttempt.id}`);
            return;
          }
          // Resume in-progress attempt
          setupAttemptData(activeQuiz, activeQuiz.userAttempt);
          setLoading(false);
          return;
        }

        // If quiz has a passcode and attempt is not started yet, check if passcode is stored in sessionStorage
        if (activeQuiz.hasPasscode) {
          let autoStarted = false;
          if (typeof window !== "undefined") {
            const storedPasscode =
              sessionStorage.getItem(`semaphore_passcode_${quizId}`) ||
              sessionStorage.getItem("semaphore_last_passcode");

            if (storedPasscode) {
              try {
                const autoRes = await fetch("/api/user/attempt/start", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ quizId, passcode: storedPasscode.trim() }),
                });
                const autoData = await autoRes.json();
                if (autoRes.ok && autoData.attempt) {
                  setupAttemptData(activeQuiz, autoData.attempt);
                  autoStarted = true;
                }
              } catch (e) {
                // Ignore failure and fallback to prompt
              }
            }
          }

          if (autoStarted) {
            setLoading(false);
            return;
          }

          setRequiresPasscode(true);
          setLoading(false);
          return;
        }

        // No passcode required: Start attempt automatically
        const startRes = await fetch("/api/user/attempt/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quizId }),
        });

        const startData = await startRes.json();
        if (!startRes.ok) {
          throw new Error(startData.error || "Failed to start attempt.");
        }

        setupAttemptData(activeQuiz, startData.attempt);
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Failed to initialize assessment.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initQuiz();

    return () => {
      isMounted = false;
    };
  }, [quizId, router, setupAttemptData]);

  // Handle Passcode Submission
  const handlePasscodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcodeInput.trim()) {
      setPasscodeError("Please enter the quiz passcode.");
      return;
    }

    setValidatingPasscode(true);
    setPasscodeError(null);

    try {
      const startRes = await fetch("/api/user/attempt/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId, passcode: passcodeInput.trim() }),
      });

      const startData = await startRes.json();
      if (!startRes.ok) {
        throw new Error(startData.error || "Invalid passcode.");
      }

      if (typeof window !== "undefined") {
        sessionStorage.setItem(`semaphore_passcode_${quizId}`, passcodeInput.trim());
        sessionStorage.setItem("semaphore_last_passcode", passcodeInput.trim());
      }

      if (quiz) {
        setupAttemptData(quiz, startData.attempt);
      }
    } catch (err: any) {
      setPasscodeError(err.message || "Failed to start quiz.");
    } finally {
      setValidatingPasscode(false);
    }
  };

  // 2. Persist answer to server
  const persistAnswer = useCallback(
    async (
      questionId: string,
      selectedOptionId: string | null,
      isReview: boolean
    ) => {
      if (!attemptId) return;

      setIsSaving(true);
      try {
        await fetch("/api/user/attempt/answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attemptId,
            questionId,
            selectedOptionId,
            isMarkedForReview: isReview,
          }),
        });
      } catch (err) {
        console.error("Auto-save error:", err);
      } finally {
        setIsSaving(false);
      }
    },
    [attemptId]
  );

  // 3. Option Selection Handler
  const handleSelectOption = (optionId: string) => {
    const currentQ = flatQuestions[currentIndex];
    if (!currentQ) return;

    const nextAnswers = {
      ...answers,
      [currentQ.id]: optionId,
    };
    setAnswers(nextAnswers);

    // Sync to local storage immediately
    syncLocalStorageBackup(quiz, attemptId, nextAnswers, reviewMarks, "IN_PROGRESS");

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      persistAnswer(currentQ.id, optionId, Boolean(reviewMarks[currentQ.id]));
    }, 300);
  };

  // 4. Clear Option Handler
  const handleClearOption = () => {
    const currentQ = flatQuestions[currentIndex];
    if (!currentQ) return;

    const nextAnswers = { ...answers };
    delete nextAnswers[currentQ.id];
    setAnswers(nextAnswers);

    // Sync to local storage immediately
    syncLocalStorageBackup(quiz, attemptId, nextAnswers, reviewMarks, "IN_PROGRESS");

    persistAnswer(currentQ.id, null, Boolean(reviewMarks[currentQ.id]));
  };

  // 5. Toggle Mark for Review
  const handleToggleReview = () => {
    const currentQ = flatQuestions[currentIndex];
    if (!currentQ) return;

    const nextState = !reviewMarks[currentQ.id];
    const nextReviews = {
      ...reviewMarks,
      [currentQ.id]: nextState,
    };
    setReviewMarks(nextReviews);

    // Sync to local storage immediately
    syncLocalStorageBackup(quiz, attemptId, answers, nextReviews, "IN_PROGRESS");

    persistAnswer(currentQ.id, answers[currentQ.id] || null, nextState);
  };

  // 6. Submit Quiz Handler (Transactional Server Scoring + LocalStorage Snapshot)
  const handleSubmitQuiz = async () => {
    if (!attemptId || isSubmitting) return;

    setIsSubmitting(true);
    const nowIso = new Date().toISOString();

    // Persist final submission snapshot in localStorage
    syncLocalStorageBackup(
      quiz,
      attemptId,
      answers,
      reviewMarks,
      "SUBMITTED",
      nowIso
    );

    try {
      const res = await fetch("/api/user/attempt/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Submission failed.");
      }

      router.replace(`/quiz/${quizId}/result/${attemptId}`);
    } catch (err: any) {
      alert(`Submission error: ${err.message}. Your answers are securely cached locally.`);
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-cyan-400 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin" />
        <p className="text-sm font-semibold tracking-wide text-slate-300">
          Loading assessment environment...
        </p>
      </div>
    );
  }

  // Passcode Required Screen
  if (requiresPasscode && quiz) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-[#070d1e] text-slate-900 dark:text-white">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{quiz.title}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Admin Passcode Required
              </p>
            </div>
          </div>

          {passcodeError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{passcodeError}</span>
            </div>
          )}

          <form onSubmit={handlePasscodeSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                Enter Passcode
              </label>
              <input
                type="text"
                value={passcodeInput}
                onChange={(e) => setPasscodeInput(e.target.value)}
                placeholder="e.g. SEM2026"
                autoFocus
                required
                disabled={validatingPasscode}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-base focus:outline-none focus:ring-2 focus:ring-cyan-500 uppercase"
              />
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-100 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60">
              ⚠️ <strong>1 User Per Team:</strong> Once started, no other member from your team can take this quiz. Timer will start immediately.
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => router.push("/")}
                disabled={validatingPasscode}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors flex items-center justify-center space-x-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>
              <button
                type="submit"
                disabled={validatingPasscode || !passcodeInput.trim()}
                className="flex-1 py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-cyan-600/20 transition-all flex items-center justify-center space-x-1.5"
              >
                {validatingPasscode ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Validating...</span>
                  </>
                ) : (
                  <>
                    <span>Start Assessment</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-[#070d1e] text-slate-900 dark:text-white space-y-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-500 flex items-center justify-center">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold">Assessment Blocked</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md">{error}</p>
        <button
          onClick={() => router.push("/")}
          className="px-6 py-2.5 rounded-xl bg-cyan-600 text-white text-sm font-bold shadow-lg hover:bg-cyan-500 transition-all flex items-center space-x-2 mx-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </button>
      </div>
    );
  }

  const currentFlat = flatQuestions[currentIndex];
  const currentQuestion = currentFlat ? questionMap[currentFlat.id] : null;

  const answeredCount = flatQuestions.filter(
    (q) => answers[q.id] !== undefined && answers[q.id] !== null
  ).length;
  const reviewCount = flatQuestions.filter((q) => reviewMarks[q.id]).length;
  const unansweredCount = flatQuestions.length - answeredCount;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070d1e] text-slate-900 dark:text-slate-100 transition-colors pb-12">
      {/* Sticky Top Header with Timer */}
      <QuizHeader
        title={quiz.title}
        totalQuestions={flatQuestions.length}
        initialSecondsRemaining={secondsRemaining}
        isSaving={isSaving}
        onTimeExpire={handleSubmitQuiz}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Question Area (8 columns on lg) */}
          <div className="lg:col-span-8 space-y-6">
            {currentQuestion ? (
              <QuestionCard
                question={currentQuestion}
                questionNumber={currentIndex + 1}
                totalQuestions={flatQuestions.length}
                sectionTitle={currentFlat.sectionTitle}
                selectedOptionId={answers[currentQuestion.id] || null}
                isMarkedForReview={Boolean(reviewMarks[currentQuestion.id])}
                onSelectOption={handleSelectOption}
                onClearOption={handleClearOption}
                onToggleReview={handleToggleReview}
                onPrevious={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                onNext={() =>
                  setCurrentIndex((prev) =>
                    Math.min(flatQuestions.length - 1, prev + 1)
                  )
                }
                hasPrevious={currentIndex > 0}
                hasNext={currentIndex < flatQuestions.length - 1}
              />
            ) : null}
          </div>

          {/* Right Question Palette (4 columns on lg) */}
          <div className="lg:col-span-4 space-y-6">
            <QuestionPalette
              questions={flatQuestions}
              currentIndex={currentIndex}
              answers={answers}
              reviewMarks={reviewMarks}
              onSelectIndex={(idx) => setCurrentIndex(idx)}
              onSubmitClick={() => setIsSubmitModalOpen(true)}
            />
          </div>
        </div>
      </main>

      {/* Confirmation Submit Modal */}
      <SubmitModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onConfirm={handleSubmitQuiz}
        isSubmitting={isSubmitting}
        totalQuestions={flatQuestions.length}
        answeredCount={answeredCount}
        unansweredCount={unansweredCount}
        reviewCount={reviewCount}
      />
    </div>
  );
}
